import { useEffect, useState } from "react";

export default function useInactivityLogout(timeoutMs = 10 * 60 * 1000) {
  const [secondsLeft, setSecondsLeft] = useState(timeoutMs / 1000);

  useEffect(() => {
    let timer:number;
    let interval:number;

    const resetTimer = () => {
      clearTimeout(timer);
      setSecondsLeft(timeoutMs / 1000);

      timer = setTimeout(() => {
        localStorage.removeItem("token");
        window.location.href = "/login";
      }, timeoutMs);
    };

    const startInterval = () => {
      interval = setInterval(() => {
        setSecondsLeft((prev) => {
          if (prev <= 1) return 0;
          return prev - 1;
        });
      }, 1000);
    };

    const events = ["click", "keydown", "scroll"];
    events.forEach(e => window.addEventListener(e, resetTimer));

    resetTimer();
    startInterval();

    return () => {
      clearTimeout(timer);
      clearInterval(interval);
      events.forEach(e => window.removeEventListener(e, resetTimer));
    };
  }, [timeoutMs]);

  return secondsLeft;
}
