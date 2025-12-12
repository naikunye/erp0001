
/**
 * EchoTikService.ts
 * 
 * Handles real interactions with the EchoTik Open API.
 * 
 * NOTE: 
 * 1. Please confirm the BASE_URL with EchoTik's official API documentation.
 * 2. If you encounter CORS (Cross-Origin) errors, you may need to:
 *    a) Use a backend proxy.
 *    b) Use a browser extension to bypass CORS for local testing.
 *    c) Check if EchoTik allows client-side calls from your domain.
 */

export interface EchoTikInfluencer {
    id: string;
    username: string;
    nickname: string;
    avatar_url: string;
    follower_count: number;
    region: string;
    gmv_30d?: number;
    avg_views?: number;
    engagement_rate?: number;
    category?: string;
    profile_url?: string;
}

// ⚠️ REPLACE THIS WITH THE REAL ECHOTIK API ENDPOINT
// Common example: https://api.echotik.live/open-api/v1
const BASE_URL = 'https://api.echotik.live/open-api/v1';

export const EchoTikService = {
    
    /**
     * Search for influencers using the real API
     */
    async searchInfluencers(apiKey: string, keyword: string, region: string = 'US'): Promise<EchoTikInfluencer[]> {
        if (!apiKey) {
            throw new Error("API Key is missing. Please configure it in Settings.");
        }

        const endpoint = `${BASE_URL}/influencers/search`;
        
        // Construct query parameters
        const params = new URLSearchParams({
            keyword: keyword,
            region: region,
            page_size: '20'
        });

        try {
            const response = await fetch(`${endpoint}?${params.toString()}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    // Check docs: Is it 'X-API-KEY', 'Authorization: Bearer', or 'X-Echotik-Token'?
                    // Defaulting to Bearer token standard.
                    'Authorization': `Bearer ${apiKey}`, 
                    'X-EchoTik-Token': apiKey // Alternate common header
                }
            });

            if (!response.ok) {
                if (response.status === 401) throw new Error("API Key 无效或过期 (401)");
                if (response.status === 403) throw new Error("无权限访问此接口 (403)");
                if (response.status === 429) throw new Error("请求过于频繁，请稍后再试 (429)");
                throw new Error(`EchoTik API Error: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();

            // Map the external API response format to our internal format
            // You may need to adjust 'data.data.list' depending on the actual JSON structure
            const rawList = data.data?.list || data.influencers || [];

            return rawList.map((item: any) => ({
                id: item.user_id || item.id,
                username: item.unique_id || item.handle || 'unknown',
                nickname: item.nickname || item.user_name || 'No Name',
                avatar_url: item.avatar_medium?.url_list?.[0] || item.avatar_url || '',
                follower_count: item.follower_count || 0,
                region: item.region || region,
                gmv_30d: item.gmv_30d || item.sales_metrics?.gmv_30d || 0,
                avg_views: item.avg_views || 0,
                engagement_rate: item.engagement_rate || 0,
                category: item.categories?.[0] || 'General',
                profile_url: `https://www.tiktok.com/@${item.unique_id}`
            }));

        } catch (error: any) {
            console.error("EchoTik Service Error:", error);
            // Handle CORS specifically for better UX
            if (error.message.includes('Failed to fetch')) {
                throw new Error("网络请求失败 (可能是跨域 CORS 限制)。请检查控制台或使用后端代理。");
            }
            throw error;
        }
    }
};
