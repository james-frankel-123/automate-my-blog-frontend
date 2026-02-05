# Relevant Tweets for a Post

## How tweets are searched

- **API**: `POST /api/tweets/search-for-topic` (sync) or **stream** `POST /api/v1/tweets/search-for-topic-stream` (SSE).
- **Frontend**: `api.searchTweetsForTopic(topic, businessInfo, maxTweets)` or `api.searchTweetsForTopicStream(topic, businessInfo, maxTweets)`.
- **Stream events**: `queries-extracted` (search terms used), `complete` (`{ tweets, searchTermsUsed }`), `error`.
- The backend derives search terms from the topic and returns tweets (e.g. text, url, author) for the frontend to display and/or insert into the preview.

## How tweets are used

1. **Parallel with blog stream**  
   - Tweet search runs in parallel with blog content generation (no wait).  
   - Blog stream starts immediately with `prefetchedTweets: []`.  
   - When the tweet stream completes, `relatedTweets` and `currentDraft.relatedTweets` are updated.

2. **Placeholders in content**  
   - The backend may emit `[TWEET:0]`, `[TWEET:1]`, … in the streamed post body.  
   - The frontend replaces these with rendered tweet content when `relatedTweets` are available (see `replaceTweetPlaceholders` in `src/utils/tweetPlaceholders.js`).  
   - Until tweets arrive, placeholders are shown as “Loading tweet…” in the preview.

3. **Display**  
   - “Related tweets” panel shows up to 5 tweets (from `relatedTweets` or `currentDraft.relatedTweets`).  
   - Preview content is passed through `replaceTweetPlaceholders(content, relatedTweets)` so `[TWEET:n]` becomes blockquote markdown.

4. **Editor / preview**  
   - TipTap has a **TweetCard** node (`div.tweet-card` with data attributes).  
   - **HTMLPreview** styles `.tweet-card` and `.tweet-fallback`.  
   - Replaced placeholders render as markdown blockquotes in the preview.

## Testbed

- The **Streaming testbed** includes a “Related tweets” section with sample tweets and can inject tweet-style content (e.g. blockquotes or `[TWEET:0]`) into the simulated stream so the preview shows tweet placeholders and replacement.

## Summary

| Step           | What happens                                                                 |
|----------------|-------------------------------------------------------------------------------|
| Search         | Topic → backend → search terms → tweet results (stream, in parallel).        |
| Blog stream    | Starts immediately; no wait for tweets.                                      |
| Placeholders   | Backend may emit `[TWEET:0]`, `[TWEET:1]` in content.                         |
| Insertion      | Frontend replaces placeholders with tweet blockquotes when tweets arrive.    |
| Display        | “Related tweets” panel and draft.relatedTweets; preview uses replaced content.|
