/**
 * Social handles: platform keys, labels, and profile URL builders.
 * Aligns with backend handoff (GET/PATCH /organizations/:id/social-handles).
 */

export const SOCIAL_PLATFORMS = [
  { key: 'twitter', label: 'Twitter / X' },
  { key: 'linkedin', label: 'LinkedIn' },
  { key: 'github', label: 'GitHub' },
  { key: 'instagram', label: 'Instagram' },
  { key: 'facebook', label: 'Facebook' },
  { key: 'youtube', label: 'YouTube' },
  { key: 'tiktok', label: 'TikTok' },
  { key: 'reddit', label: 'Reddit' },
  { key: 'pinterest', label: 'Pinterest' },
  { key: 'medium', label: 'Medium' },
  { key: 'substack', label: 'Substack' },
  { key: 'mastodon', label: 'Mastodon' },
  { key: 'threads', label: 'Threads' },
  { key: 'bluesky', label: 'Bluesky' },
  { key: 'tumblr', label: 'Tumblr' },
  { key: 'vimeo', label: 'Vimeo' },
  { key: 'dribbble', label: 'Dribbble' },
  { key: 'behance', label: 'Behance' },
  { key: 'soundcloud', label: 'SoundCloud' },
  { key: 'twitch', label: 'Twitch' },
  { key: 'telegram', label: 'Telegram' },
  { key: 'patreon', label: 'Patreon' },
  { key: 'linktree', label: 'Linktree' },
  { key: 'snapchat', label: 'Snapchat' },
  { key: 'kofi', label: 'Ko-fi' },
  { key: 'buymeacoffee', label: 'Buy Me a Coffee' },
  { key: 'discord', label: 'Discord' },
];

/**
 * @param {string} platformKey
 * @param {string} handle
 * @returns {string|null} Profile URL or null if no pattern
 */
export function socialProfileLink(platformKey, handle) {
  const h = (handle || '').trim();
  if (!h) return null;
  switch (platformKey) {
    case 'twitter':
      return `https://x.com/${h.replace(/^@/, '')}`;
    case 'linkedin':
      return `https://www.linkedin.com/company/${h.replace(/^company\/?/, '')}`;
    case 'facebook':
      return `https://www.facebook.com/${h}`;
    case 'instagram':
      return `https://www.instagram.com/${h.replace(/^@/, '')}`;
    case 'youtube':
      return h.startsWith('@') ? `https://www.youtube.com/${h}` : h.startsWith('c/') ? `https://www.youtube.com/${h}` : `https://www.youtube.com/channel/${h}`;
    case 'tiktok':
      return `https://www.tiktok.com/@${h.replace(/^@/, '')}`;
    case 'github':
      return `https://github.com/${h.replace(/^@/, '')}`;
    case 'reddit':
      return h.startsWith('r/') ? `https://reddit.com/${h}` : `https://reddit.com/user/${h}`;
    case 'pinterest':
      return `https://pinterest.com/${h}`;
    case 'medium':
      return h.startsWith('@') ? `https://medium.com/${h}` : `https://medium.com/@${h}`;
    case 'substack':
      return h.includes('.') ? `https://${h}` : `https://${h}.substack.com`;
    case 'threads':
      return `https://threads.net/@${h.replace(/^@/, '')}`;
    case 'bluesky':
      return `https://bsky.app/profile/${h.replace(/^@/, '')}`;
    case 'tumblr':
      return h.includes('.') ? `https://${h}` : `https://${h}.tumblr.com`;
    case 'vimeo':
      return `https://vimeo.com/${h}`;
    case 'dribbble':
      return `https://dribbble.com/${h}`;
    case 'behance':
      return `https://behance.net/${h}`;
    case 'soundcloud':
      return `https://soundcloud.com/${h}`;
    case 'twitch':
      return `https://twitch.tv/${h}`;
    case 'telegram':
      return h.startsWith('t.me/') ? `https://${h}` : `https://t.me/${h.replace(/^@/, '')}`;
    case 'patreon':
      return `https://patreon.com/${h}`;
    case 'linktree':
      return `https://linktr.ee/${h}`;
    case 'snapchat':
      return `https://snapchat.com/add/${h}`;
    case 'kofi':
      return `https://ko-fi.com/${h}`;
    case 'buymeacoffee':
      return `https://buymeacoffee.com/${h}`;
    default:
      return null;
  }
}
