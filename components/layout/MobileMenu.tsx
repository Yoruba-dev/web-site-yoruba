"use client";

import { useState } from "react";
import Link from "next/link";
import { MAIN_MENU, type MenuItem, type MenuLink } from "@/lib/menu";

// Recursive accordion item mirroring the template's offcanvas mobile menu.
function Item({
  label,
  href,
  children,
  onNavigate,
}: {
  label: string;
  href?: string;
  children?: React.ReactNode;
  onNavigate: () => void;
}) {
  const [open, setOpen] = useState(false);
  const hasChildren = Boolean(children);

  return (
    <li className={`menu-item-has-children${open ? " menu-open" : ""}`}>
      {href ? (
        <Link href={href} onClick={onNavigate}>
          <span className="mm-text">{label}</span>
        </Link>
      ) : (
        <a onClick={() => setOpen((v) => !v)} style={{ cursor: "pointer" }}>
          <span className="mm-text">{label}</span>
        </a>
      )}
      {hasChildren && (
        <span
          className="menu-expand"
          onClick={() => setOpen((v) => !v)}
          style={{ cursor: "pointer" }}
        >
          <i className="ion-ios-plus-empty" />
        </span>
      )}
      {hasChildren && (
        <ul className="sub-menu" style={{ display: open ? "block" : "none" }}>
          {children}
        </ul>
      )}
    </li>
  );
}

function leafLinks(links: MenuLink[], onNavigate: () => void) {
  return links.map((l) => (
    <li key={l.label + l.href}>
      <Link href={l.href} onClick={onNavigate}>
        <span className="mm-text">{l.label}</span>
      </Link>
    </li>
  ));
}

function renderItem(item: MenuItem, onNavigate: () => void) {
  if (item.megaColumns) {
    return (
      <Item key={item.label} label={item.label} onNavigate={onNavigate}>
        {item.megaColumns.map((col) => (
          <Item key={col.title} label={col.title} onNavigate={onNavigate}>
            {leafLinks(col.links, onNavigate)}
          </Item>
        ))}
      </Item>
    );
  }
  if (item.dropdown) {
    return (
      <Item key={item.label} label={item.label} onNavigate={onNavigate}>
        {leafLinks(item.dropdown, onNavigate)}
      </Item>
    );
  }
  return (
    <li key={item.label}>
      <Link href={item.href} onClick={onNavigate}>
        <span className={`mm-text${item.highlight ? " pyj-nav-mayoreo" : ""}`}>
          {item.label}
        </span>
      </Link>
    </li>
  );
}

export default function MobileMenu({ onNavigate }: { onNavigate: () => void }) {
  return (
    <nav className="offcanvas-navigation">
      <ul className="mobile-menu">
        {MAIN_MENU.map((item) => renderItem(item, onNavigate))}
      </ul>
    </nav>
  );
}
