import axios from "axios";

export async function fetchNoembed(url) {
  const endpoint = `https://noembed.com/embed?url=${encodeURIComponent(url)}`;
  const { data } = await axios.get(endpoint, { timeout: 8000 });
  return {
    providerName: data.provider_name || null,
    title: data.title || null,
    thumbnailUrl: data.thumbnail_url || null,
    html: data.html || null
  };
}