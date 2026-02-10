/**
 * AnalysisSectionNav — Granular in-page navigation for website analysis and strategy sections (Issue #168).
 * Renders a list of section links with smooth scrolling and scroll-spy active state.
 */
import React, { useState, useEffect, useRef } from 'react';
import { Typography } from 'antd';
import { MenuOutlined } from '@ant-design/icons';

const { Text } = Typography;

const ROOT_MARGIN = '-20% 0px -70% 0px'; // Consider "active" when section is in upper third of viewport
const THRESHOLD = 0;

/**
 * @param {Object} props
 * @param {Array<{ id: string, label: string }>} props.sections - Section id and label for nav items
 * @param {string} [props.className] - Optional class name
 * @param {Object} [props.style] - Optional container style
 * @param {boolean} [props.collapsibleOnMobile=true] - On small screens, show as compact/collapsible
 * @param {Function} [props.onSectionClick] - Called with (id) before scrolling; use e.g. to expand a collapse that contains the section
 */
export function AnalysisSectionNav({ sections, className = '', style = {}, collapsibleOnMobile: _collapsibleOnMobile = true, onSectionClick }) {
  const [activeId, setActiveId] = useState(sections[0]?.id ?? null);
  const observerRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    if (!sections.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          setActiveId(entry.target.id);
        });
      },
      { rootMargin: ROOT_MARGIN, threshold: THRESHOLD }
    );
    observerRef.current = observer;

    sections.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    return () => {
      sections.forEach(({ id }) => {
        const el = document.getElementById(id);
        if (el) observer.unobserve(el);
      });
    };
  }, [sections]);

  const scrollToSection = (id) => {
    onSectionClick?.(id);
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setActiveId(id);
    }
  };

  if (!sections.length) return null;

  const navItemStyle = (id) => ({
    textAlign: 'left',
    padding: '8px 12px',
    border: 'none',
    borderRadius: 6,
    background: activeId === id ? 'var(--color-primary-100)' : 'transparent',
    color: activeId === id ? 'var(--color-primary-700)' : 'var(--color-text-secondary)',
    fontSize: 14,
    cursor: 'pointer',
    transition: 'background 0.2s, color 0.2s',
    whiteSpace: 'nowrap',
    flexShrink: 0,
  });

  const navList = (
    <nav
      role="navigation"
      aria-label="Analysis sections"
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
      }}
    >
      {sections.map(({ id, label }) => (
        <button
          key={id}
          type="button"
          onClick={() => scrollToSection(id)}
          data-section-id={id}
          data-testid={`analysis-nav-${id}`}
          style={navItemStyle(id)}
          onMouseEnter={(e) => {
            if (activeId !== id) {
              e.currentTarget.style.background = 'var(--color-background-container)';
              e.currentTarget.style.color = 'var(--color-text-primary)';
            }
          }}
          onMouseLeave={(e) => {
            if (activeId !== id) {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.color = 'var(--color-text-secondary)';
            }
          }}
        >
          {label}
        </button>
      ))}
    </nav>
  );

  return (
    <div
      ref={containerRef}
      className={className}
      style={{
        position: 'sticky',
        top: 88,
        alignSelf: 'flex-start',
        minWidth: 180,
        maxWidth: 220,
        padding: '12px 0',
        ...style,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          marginBottom: 8,
          padding: '0 12px',
        }}
      >
        <MenuOutlined style={{ color: 'var(--color-text-tertiary)', fontSize: 14 }} />
        <Text style={{ fontSize: 12, color: 'var(--color-text-tertiary)', fontWeight: 500 }}>
          Sections
        </Text>
      </div>
      {navList}
    </div>
  );
}

/**
 * Horizontal strip nav for use on mobile (e.g. above content in same column).
 * Pass same sections; use in a Col that shows only on xs.
 */
export function AnalysisSectionNavHorizontal({ sections, onSectionClick, className = '', style = {} }) {
  const [activeId, setActiveId] = useState(sections[0]?.id ?? null);

  useEffect(() => {
    if (!sections.length) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          setActiveId(entry.target.id);
        });
      },
      { rootMargin: ROOT_MARGIN, threshold: THRESHOLD }
    );
    sections.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });
    return () => {
      sections.forEach(({ id }) => {
        const el = document.getElementById(id);
        if (el) observer.unobserve(el);
      });
    };
  }, [sections]);

  const scrollToSection = (id) => {
    onSectionClick?.(id);
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setActiveId(id);
    }
  };

  if (!sections.length) return null;

  return (
    <div className={className} style={style}>
      <nav
        role="navigation"
        aria-label="Analysis sections"
        style={{
          display: 'flex',
          flexDirection: 'row',
          gap: 4,
          overflowX: 'auto',
          paddingBottom: 8,
          scrollbarWidth: 'thin',
        }}
      >
        {sections.map(({ id, label }) => (
          <button
            key={id}
            type="button"
            onClick={() => scrollToSection(id)}
            data-section-id={id}
            data-testid={`analysis-nav-${id}`}
            style={{
              padding: '8px 12px',
              border: 'none',
              borderRadius: 6,
              background: activeId === id ? 'var(--color-primary-100)' : 'transparent',
              color: activeId === id ? 'var(--color-primary-700)' : 'var(--color-text-secondary)',
              fontSize: 14,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              flexShrink: 0,
            }}
          >
            {label}
          </button>
        ))}
      </nav>
    </div>
  );
}

export default AnalysisSectionNav;
