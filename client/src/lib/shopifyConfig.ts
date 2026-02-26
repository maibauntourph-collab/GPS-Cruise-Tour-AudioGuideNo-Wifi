/**
 * Shopify Storefront API Configuration
 * [적요] 랜드마크 방문 시 로컬 상품을 구매할 수 있는 Shopify 연동 설정입니다.
 * 학생 여러분, Headless Commerce 환경에서는 API를 통해 상품 정보를 가져와 UI를 직접 구성합니다.
 */

export const SHOPIFY_CONFIG = {
    domain: 'YOUR_SHOPIFY_STORE_DOMAIN', // e.g., 'your-store.myshopify.com'
    storefrontAccessToken: 'YOUR_STOREFRONT_ACCESS_TOKEN',
    apiVersion: '2024-01',
};

export interface ShopifyProduct {
    id: string;
    title: string;
    description: string;
    image: string;
    price: string;
    currencyCode: string;
    checkoutUrl: string;
}

// [Bug Doctor] 초기 개발 및 데모를 위한 Mock 데이터
// 실제 운영 시에는 fetchShopifyProducts 함수를 호출하여 DB의 랜드마크 태그와 매칭합니다.
export const MOCK_PRODUCTS: Record<string, ShopifyProduct[]> = {
    'Colosseum': [
        {
            id: 'p1',
            title: 'Romulus & Remus Statue',
            description: 'Handcrafted miniature of the legendary founders of Rome.',
            image: 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=400&q=80',
            price: '45.00',
            currencyCode: 'EUR',
            checkoutUrl: '#'
        },
        {
            id: 'p2',
            title: 'Gladiator Helmet Replica',
            description: 'Authentic 1:4 scale replica of a Murmillo helmet.',
            image: 'https://images.unsplash.com/photo-1599394022918-6c27659dc5bc?w=400&q=80',
            price: '120.00',
            currencyCode: 'EUR',
            checkoutUrl: '#'
        }
    ],
    'Eiffel Tower': [
        {
            id: 'p3',
            title: 'Parisian Artist Sketchbook',
            description: 'Premium linen-bound sketchbook for urban explorers.',
            image: 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=400&q=80',
            price: '28.00',
            currencyCode: 'EUR',
            checkoutUrl: '#'
        }
    ]
};

/**
 * 랜드마크 이름을 기반으로 Shopify 상품을 가져오는 함수 (Mock)
 */
export const getShopifyProducts = async (landmarkName: string): Promise<ShopifyProduct[]> => {
    // 실제 구현 시에는 fetch(shopifyUrl, { header, body: graphqlQuery }) 를 사용합니다.
    console.log(`🛒 [Shopify] Fetching products for: ${landmarkName}`);
    return MOCK_PRODUCTS[landmarkName] || [];
};
