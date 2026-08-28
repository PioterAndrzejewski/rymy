import { useEffect, useRef, useState } from 'react';

/**
 * Nasłuch mikrofonu przez Web Speech API.
 *
 * Cała kapryśność tego API siedzi tutaj, żeby komponent widział tylko
 * „stan + podgląd + gotowe słowa". Aplikacja jest statyczna (GitHub Pages),
 * więc Whisper i spółka odpadają — zostaje rozpoznawanie wbudowane
 * w przeglądarkę. Firefox go nie ma i to jest w porządku: `supported`
 * wychodzi `false`, a przycisk mikrofonu się nie rysuje.
 */

export type SpeechState = 'unsupported' | 'idle' | 'listening' | 'denied' | 'error';

type Options = {
  lang?: string;
  /** steruje startem i stopem z zewnątrz */
  enabled: boolean;
  /** wyłącznie finalne wyniki, już rozbite na słowa */
  onWords: (tokens: string[]) => void;
};

/** „Wodospadem, kurcze!" → ['wodospadem', 'kurcze'] */
export function tokenize(text: string): string[] {
  return text.toLowerCase().split(/[^\p{L}]+/u).filter(Boolean);
}

function getRecognitionCtor() {
  if (typeof window === 'undefined') return undefined;
  return window.SpeechRecognition ?? window.webkitSpeechRecognition;
}

export function useSpeechInput({ lang = 'pl-PL', enabled, onWords }: Options) {
  const supported = useRef(!!getRecognitionCtor()).current;
  const [state, setState] = useState<SpeechState>(supported ? 'idle' : 'unsupported');
  const [interim, setInterim] = useState('');

  // Callback trzymamy w refie: zmienia się co render, a nie chcemy przez to
  // restartować rozpoznawania w środku rundy.
  const onWordsRef = useRef(onWords);
  onWordsRef.current = onWords;

  const recognitionRef = useRef<SpeechRecognition | null>(null);
  /** czy wolno restartować po `onend` — gasimy przy sprzątaniu i po odmowie */
  const wantedRef = useRef(false);
  const restartTimer = useRef<number | undefined>(undefined);

  useEffect(() => {
    const Ctor = getRecognitionCtor();
    if (!Ctor || !enabled) {
      setInterim('');
      return;
    }

    const recognition = new Ctor();
    recognitionRef.current = recognition;
    wantedRef.current = true;

    recognition.lang = lang;
    recognition.interimResults = true;
    // Na mobile i tak nie działa (sesja kończy się po ciszy), ale na desktopie
    // oszczędza restarty.
    recognition.continuous = true;

    recognition.onstart = () => setState('listening');

    recognition.onresult = (event) => {
      const finals: string[] = [];
      let pending = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const text = result[0]?.transcript ?? '';
        // Nie-finalne wyniki to połówki słów — do podglądu, nigdy do banku.
        if (result.isFinal) finals.push(text);
        else pending += text;
      }
      setInterim(pending.trim());
      const tokens = finals.flatMap(tokenize);
      if (tokens.length) {
        setInterim('');
        onWordsRef.current(tokens);
      }
    };

    recognition.onerror = (event) => {
      if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
        // Odmowa dostępu jest ostateczna — restartowanie w kółko tylko
        // wywoła kolejne prompty.
        wantedRef.current = false;
        setState('denied');
        return;
      }
      // 'no-speech' i 'aborted' są normalne przy ciszy — restart zrobi `onend`.
      if (event.error !== 'no-speech' && event.error !== 'aborted') setState('error');
    };

    recognition.onend = () => {
      setInterim('');
      if (!wantedRef.current) {
        setState('idle');
        return;
      }
      // Obie mobilne platformy kończą sesję po chwili ciszy niezależnie od
      // `continuous`, więc podnosimy ją z powrotem, dopóki mikrofon ma być włączony.
      restartTimer.current = window.setTimeout(() => {
        if (!wantedRef.current) return;
        try {
          recognition.start();
        } catch {
          // iOS potrafi rzucić InvalidStateError, gdy sesja jeszcze się nie
          // domknęła — następny `onend` spróbuje ponownie.
        }
      }, 120);
    };

    try {
      recognition.start();
    } catch {
      setState('error');
    }

    return () => {
      wantedRef.current = false;
      window.clearTimeout(restartTimer.current);
      recognition.onresult = null;
      recognition.onerror = null;
      recognition.onend = null;
      recognition.onstart = null;
      try { recognition.abort(); } catch { /* już zamknięte */ }
      recognitionRef.current = null;
      setInterim('');
      setState((s) => (s === 'denied' ? s : 'idle'));
    };
  }, [enabled, lang]);

  return { state, interim, supported };
}
