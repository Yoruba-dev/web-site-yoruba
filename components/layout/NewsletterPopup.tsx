"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "hiraola_newsletter_dismissed";

// Ported from the template: appears 5s after load, can be dismissed.
// Improvement: the "Don't show again" checkbox now persists via localStorage.
export default function NewsletterPopup() {
  const [visible, setVisible] = useState(false);
  const [closing, setClosing] = useState(false);
  const [dontShow, setDontShow] = useState(false);

  useEffect(() => {
    if (localStorage.getItem(STORAGE_KEY)) return;
    const t = setTimeout(() => setVisible(true), 5000);
    return () => clearTimeout(t);
  }, []);

  function close() {
    if (dontShow) localStorage.setItem(STORAGE_KEY, "1");
    setClosing(true);
    setTimeout(() => setVisible(false), 500);
  }

  if (!visible) return null;

  return (
    <div
      className="popup_wrapper"
      style={{
        opacity: closing ? 0 : 1,
        visibility: "visible",
        transition: "opacity 0.5s ease",
      }}
    >
      <div className="test">
        <span className="popup_off" onClick={close}>
          <i className="ion-android-close" />
        </span>
        <div className="subscribe_area">
          <h2>Sign Up Newsletter</h2>
          <p>
            Subscribe to our store mailing list to receive updates on new
            arrivals, special offers and other discount information.
          </p>
          <div className="subscribe-form-group">
            <form className="subscribe-form" action="#">
              <input
                autoComplete="off"
                type="email"
                name="email"
                placeholder="Enter your email address"
              />
              <button type="submit">subscribe</button>
            </form>
          </div>
          <div className="subscribe-bottom">
            <input
              type="checkbox"
              id="newsletter-permission"
              checked={dontShow}
              onChange={(e) => setDontShow(e.target.checked)}
            />
            <label htmlFor="newsletter-permission">
              Don&apos;t show this popup again
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}
