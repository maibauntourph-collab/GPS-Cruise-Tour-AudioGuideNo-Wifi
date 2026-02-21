
import { automationService } from "../server/services/automationService";

async function runTest() {
    console.log("🚀 Testing Story Teller Lee Persona Integration...\n");

    // 1. Test generatePromotionContent
    console.log("--- 1. Testing generatePromotionContent ---");
    const mockLandmark = {
        id: "test-landmark-1",
        name: "Golden Gate Bridge Clone",
        description: "A mysterious clone of the Golden Gate Bridge that appeared overnight in Seoul.",
        lat: 37.5,
        lng: 127.0,
        category: "Landmark",
        isPremium: false,
        googlePlaceId: "test",
        rating: 5,
        reviews: 100,
        images: [],
        cityId: 1,
        subscriptionTier: "free"
    };

    await automationService.generatePromotionContent(mockLandmark as any);

    // 2. Test discoverLandmarks
    console.log("\n--- 2. Testing discoverLandmarks ---");
    const city = "Busan";
    const landmarks = await automationService.discoverLandmarks(city);

    console.log(`\nDiscovered ${landmarks.length} landmarks for ${city}:`);
    if (landmarks.length > 0) {
        console.log("First landmark narration sample:");
        console.log(landmarks[0].narration);
    }
}

runTest().catch(console.error);
