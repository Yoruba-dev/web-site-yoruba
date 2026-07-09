import { SITE } from "@/lib/site";

// The brand's social + WhatsApp links, in one place. Only the accounts the
// business actually has (Instagram, TikTok, WhatsApp). TikTok has no icon in the
// template's FontAwesome build, so it uses an inline SVG that always renders.
export default function SocialLinks({ className = "" }: { className?: string }) {
  return (
    <div className={`hiraola-social_link ${className}`}>
      <ul>
        <li className="instagram">
          <a href={SITE.social.instagram} target="_blank" rel="noreferrer" title="Instagram">
            <i className="fab fa-instagram" />
          </a>
        </li>
        <li className="tiktok">
          <a
            href={SITE.social.tiktok}
            target="_blank"
            rel="noreferrer"
            title="TikTok"
            aria-label="TikTok"
          >
            <svg
              viewBox="0 0 448 512"
              width="1em"
              height="1em"
              fill="currentColor"
              aria-hidden="true"
              style={{ verticalAlign: "-0.125em" }}
            >
              <path d="M448 209.9a210.1 210.1 0 0 1-122.8-39.3V349.4A162.6 162.6 0 1 1 185 188.3v89.9a74.6 74.6 0 1 0 52.2 71.2V0h88a121.2 121.2 0 0 0 1.9 22.2 122.2 122.2 0 0 0 53.9 80.2 121.4 121.4 0 0 0 67 20.1z" />
            </svg>
          </a>
        </li>
        <li className="whatsapp">
          <a href={SITE.contact.whatsapp} target="_blank" rel="noreferrer" title="WhatsApp">
            <i className="fab fa-whatsapp" />
          </a>
        </li>
      </ul>
    </div>
  );
}
