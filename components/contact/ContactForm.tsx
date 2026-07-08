"use client";

import { useState } from "react";

export default function ContactForm() {
  const [sent, setSent] = useState(false);

  return (
    <div className="contact-form">
      <form
        id="contact-form"
        action="#"
        onSubmit={(e) => {
          e.preventDefault();
          setSent(true);
        }}
      >
        <div className="form-group">
          <label>
            Your Name <span className="required">*</span>
          </label>
          <input type="text" name="con_name" required />
        </div>
        <div className="form-group">
          <label>
            Your Email <span className="required">*</span>
          </label>
          <input type="email" name="con_email" required />
        </div>
        <div className="form-group">
          <label>Subject</label>
          <input type="text" name="con_subject" />
        </div>
        <div className="form-group form-group-2">
          <label>Your Message</label>
          <textarea name="con_message" />
        </div>
        <div className="form-group">
          <button
            type="submit"
            value="submit"
            id="submit"
            className="hiraola-contact-form_btn"
            name="submit"
          >
            send
          </button>
        </div>
      </form>
      <p className="form-message mt-3 mb-0">
        {sent ? "Thanks! Your message has been sent. We'll get back to you shortly." : ""}
      </p>
    </div>
  );
}
