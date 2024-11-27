import { AtpAgent } from "@atproto/api";

// Create a Bluesky Agent
const agent = new AtpAgent({
  service: "https://bsky.social",
});

export async function GET() {
  const theThingPosts = await fetchBlueskyPosts();

  let mostPopularPost = theThingPosts[0];
  let mostPopularPostScore =
    mostPopularPost.replyCount +
    mostPopularPost.repostCount +
    mostPopularPost.likeCount +
    mostPopularPost.quoteCount;

  for (const post of theThingPosts) {
    const score =
      post.replyCount + post.repostCount + post.likeCount + post.quoteCount;

    if (score > mostPopularPostScore) {
      mostPopularPostScore = score;
      mostPopularPost = post;
    }
  }

  await agent.login({
    identifier: process.env.BLUESKY_USERNAME!,
    password: process.env.BLUESKY_PASSWORD!,
  });

  await agent.repost(mostPopularPost.uri, mostPopularPost.cid);

  return Response.json({ mostPopularPost });
}

const fetchBlueskyPosts = async () => {
  // Define the API endpoint and query parameters
  const endpoint = "https://public.api.bsky.app/xrpc/app.bsky.feed.searchPosts";
  const query = "the thing is"; // The phrase to search for
  const params = new URLSearchParams({
    q: `"${query}"`, // Wrapping in quotes ensures exact matching
  });

  try {
    // Send the GET request
    const response = await fetch(`${endpoint}?${params}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    // Check if the response is successful
    if (!response.ok) {
      throw new Error(`Error: ${response.status} - ${response.statusText}`);
    }

    // Parse the JSON response
    const data = await response.json();

    const exactMatches = data.posts.filter(
      (post: {
        record: {
          text: string;
        };
      }) =>
        post.record.text.trim().toLowerCase().startsWith(query.toLowerCase()),
    );

    return exactMatches;
  } catch (error) {
    console.error("Error fetching posts:", error);
  }
};
