/**
 * AudienceCard — white card with image, segment, problem, pitch. Selectable.
 * Issue #261.
 */
import React, { useState } from 'react';
import { Card, Typography } from 'antd';
import { CheckCircleFilled } from '@ant-design/icons';

const { Text } = Typography;

/** Clean targetSegment text by removing verbose "Step 1-5" funnel data and demographics. */
function cleanTargetSegment(targetSegment) {
  let text = '';

  // Convert to string if it's an object
  if (typeof targetSegment === 'string') {
    text = targetSegment;
  } else if (typeof targetSegment === 'object' && targetSegment !== null) {
    // Try to get a reasonable field from the object
    text = targetSegment.description || targetSegment.searchBehavior || targetSegment.psychographics || targetSegment.demographics || '';
  } else {
    return 'Target audience';
  }

  // FIRST: Remove everything from "Step 1" onwards (this removes ALL funnel analysis)
  const stepIndex = text.search(/Step \d+:/);
  if (stepIndex !== -1) {
    text = text.substring(0, stepIndex);
  }

  // Split text into sentences (handle cases where periods might be missing)
  // Look for capital letters that might start new sentences
  const sentences = text.split(/\.(?=\s*[A-Z])|(?<=[a-z])(?=[A-Z][a-z])|(?<=\w)(?=Professionals|Environmental|Frequent)/);

  // Find the best sentence: one that contains description keywords
  let bestSentence = '';
  for (const sentence of sentences) {
    const cleaned = sentence.trim();
    if (cleaned.length < 30) continue; // Too short
    if (cleaned.length > 250) continue; // Too long

    // Prefer sentences with these keywords
    if (/seeking|looking for|advanced|educational|resources|collaborations|stay updated/i.test(cleaned)) {
      bestSentence = cleaned;
      break;
    }

    // Fallback: take any reasonable sentence
    if (!bestSentence && cleaned.length > 40) {
      bestSentence = cleaned;
    }
  }

  if (bestSentence) {
    text = bestSentence;
  }

  // Final cleanup: remove demographic prefixes and artifacts
  text = text
    .replace(/^(Environmental scientists, researchers, and academics|Frequent online searches for.*?(?=Professionals)|Professionals in the field of)\s*/gi, '')
    .replace(/\d+[-–]\d+%/g, '') // Remove percentage ranges
    .replace(/\$[\d,]+-\$[\d,]+/g, '') // Remove dollar amounts
    .replace(/\(.*?\)/g, '') // Remove parenthetical content
    .replace(/^[,\s·]+|[,\s·]+$/g, '') // Remove leading/trailing punctuation
    .trim();

  // Ensure first letter is capitalized
  if (text && text.length > 0) {
    text = text.charAt(0).toUpperCase() + text.slice(1);
  }

  // If we have a reasonable description, return it
  if (text && text.length > 20 && text.length < 300) {
    return text;
  }

  return 'Target audience';
}

/** Ensure value is a string safe to render. */
function toDisplayString(val) {
  if (val == null) return '';
  if (typeof val === 'string') return val.trim() || '';
  if (typeof val === 'object') {
    const parts = [];
    Object.entries(val).forEach(([k, v]) => {
      if (v == null) return;
      const s = typeof v === 'string' ? v : (typeof v === 'object' ? JSON.stringify(v) : String(v));
      if (s.trim()) parts.push(s);
    });
    return parts.join(' · ');
  }
  return String(val);
}

const CARD_STYLE = {
  background: 'var(--color-background-elevated)',
  borderRadius: 'var(--radius-xl)',
  boxShadow: 'var(--shadow-card)',
  overflow: 'hidden',
};

export function AudienceCard({
  imageUrl,
  targetSegment,
  customerProblem,
  pitch,
  selected,
  onClick,
  dataTestId,
}) {
  const [imageError, setImageError] = useState(false);
  const showImage = imageUrl && !imageError;
  return (
    <Card
      data-testid={dataTestId}
      style={{
        ...CARD_STYLE,
        border: selected ? '2px solid var(--color-primary)' : '1px solid var(--color-border-base)',
        cursor: 'pointer',
      }}
      bodyStyle={{ padding: 0 }}
      onClick={onClick}
    >
      <div style={{ aspectRatio: '16/9', background: 'var(--color-background-container)', position: 'relative' }}>
        {showImage ? (
          <img src={imageUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={() => setImageError(true)} />
        ) : (
          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-tertiary)' }}>
            Audience
          </div>
        )}
        {selected && (
          <CheckCircleFilled
            style={{
              position: 'absolute',
              top: 12,
              right: 12,
              fontSize: 24,
              color: 'var(--color-primary)',
            }}
          />
        )}
      </div>
      <div style={{ padding: 16 }}>
        {cleanTargetSegment(targetSegment) && (
          <Text strong style={{ display: 'block', marginBottom: 4, color: 'var(--color-text-primary)' }}>{cleanTargetSegment(targetSegment)}</Text>
        )}
        {toDisplayString(customerProblem) && (
          <Text type="secondary" style={{ fontSize: 13, display: 'block', marginBottom: 8, color: 'var(--color-text-secondary)' }}>
            {toDisplayString(customerProblem)}
          </Text>
        )}
        {toDisplayString(pitch) && (
          <Text style={{ fontSize: 14, color: 'var(--color-text-primary)' }}>{toDisplayString(pitch)}</Text>
        )}
      </div>
    </Card>
  );
}

export default AudienceCard;
