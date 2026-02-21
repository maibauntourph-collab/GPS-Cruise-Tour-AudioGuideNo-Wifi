import { useRoute, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { ArrowLeft, MapPin, Clock, Star, Share2, Heart } from "lucide-react";

// Same mock data for simplicity (in a real app, this would come from an API or a shared store)
const PRODUCTS = [
    {
        id: 1,
        title: "Classic Rome Walking Tour",
        description: "Explore the ancient streets of Rome with our guided audio tour. This immersive experience takes you through the Colosseum, Roman Forum, and Palatine Hill. Listen to expert historians narrate the rise and fall of the Roman Empire as you walk in the footsteps of emperors.",
        price: "$19.99",
        image: "https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=1200&q=80",
        rating: 4.8,
        reviews: 124,
        duration: "2 hours",
        location: "Rome, Italy",
        tags: ["Best Seller", "Walking", "History"],
        highlights: ["Skip-the-line access info", "Offline map included", "Expert audio commentary"]
    },
    {
        id: 2,
        title: "Paris Louvre Museum Guide",
        description: "Navigate the vast Louvre museum with ease and learn about masterpieces. From the Mona Lisa to the Venus de Milo, discover the secrets behind the world's most famous art collection. Includes a customized route for the must-see highlights.",
        price: "$24.99",
        image: "https://images.unsplash.com/photo-1499856871940-a09627c6d7db?w=1200&q=80",
        rating: 4.9,
        reviews: 89,
        duration: "3 hours",
        location: "Paris, France",
        tags: ["Museum", "Indoor", "Art"],
        highlights: ["Interactive map", "Detailed artwork descriptions", "Curated routes"]
    },
    {
        id: 3,
        title: "London Royal Palaces",
        description: "Discover the history of London's most famous royal residences. Walk from Buckingham Palace to St. James's Palace and learn about the British Monarchy throughout the ages. Perfect for royal enthusiasts.",
        price: "$15.99",
        image: "https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=1200&q=80",
        rating: 4.7,
        reviews: 56,
        duration: "1.5 hours",
        location: "London, UK",
        tags: ["History", "Royal", "Walking"],
        highlights: ["Guard change schedule", "Royal family history", "Scenic park walk"]
    },
    {
        id: 4,
        title: "Tokyo Digital Art Museum",
        description: "Immerse yourself in the digital art world of Tokyo. A complete guide to the borderless world of teamLab. Understand the concepts behind the light installations and find the best photo spots.",
        price: "$29.99",
        image: "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=1200&q=80",
        rating: 5.0,
        reviews: 210,
        duration: "2.5 hours",
        location: "Tokyo, Japan",
        tags: ["Art", "Modern", "Interactive"],
        highlights: ["Photo spot guide", "Concept explanations", "Interactive feature guide"]
    }
];

export default function ProductDetail() {
    const [, setLocation] = useLocation();
    const [match, params] = useRoute("/product/:id");

    if (!match) {
        return <div>Product not found</div>;
    }

    const id = parseInt(params.id);
    const product = PRODUCTS.find(p => p.id === id);

    if (!product) {
        return (
            <div className="container mx-auto py-16 text-center">
                <h2 className="text-2xl font-bold mb-4">Product Not Found</h2>
                <Button onClick={() => setLocation("/products")}>Back to Products</Button>
            </div>
        );
    }

    return (
        <div className="container mx-auto py-8 text-foreground max-w-4xl">
            <Button
                variant="ghost"
                className="mb-6 pl-0 hover:bg-transparent hover:text-primary"
                onClick={() => setLocation("/products")}
            >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Tours
            </Button>

            <div className="grid md:grid-cols-2 gap-8">
                {/* Image Section */}
                <div className="space-y-4">
                    <Card className="overflow-hidden border-none shadow-none">
                        <AspectRatio ratio={4 / 3} className="bg-muted rounded-lg overflow-hidden">
                            <img
                                src={product.image}
                                alt={product.title}
                                className="object-cover w-full h-full"
                            />
                        </AspectRatio>
                    </Card>

                    <div className="flex gap-2 justify-center">
                        {/* Thumbnail placeholders if needed */}
                    </div>
                </div>

                {/* Info Section */}
                <div className="space-y-6">
                    <div>
                        <div className="flex flex-wrap gap-2 mb-3">
                            {product.tags.map(tag => (
                                <Badge key={tag} variant="secondary">{tag}</Badge>
                            ))}
                        </div>
                        <h1 className="text-3xl font-bold mb-2">{product.title}</h1>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <div className="flex items-center text-yellow-500 font-medium">
                                <Star className="w-4 h-4 mr-1 fill-current" />
                                {product.rating} <span className="text-muted-foreground ml-1">({product.reviews} reviews)</span>
                            </div>
                            <div className="flex items-center">
                                <MapPin className="w-4 h-4 mr-1" />
                                {product.location}
                            </div>
                        </div>
                    </div>

                    <div className="bg-card border rounded-lg p-4 space-y-3">
                        <div className="flex items-baseline justify-between">
                            <span className="text-2xl font-bold text-primary">{product.price}</span>
                            <span className="text-sm text-muted-foreground">per person</span>
                        </div>
                        <div className="flex gap-2">
                            <Button className="w-full text-lg" size="lg">Book Now</Button>
                            <Button size="icon" variant="outline"><Heart className="w-5 h-5" /></Button>
                            <Button size="icon" variant="outline"><Share2 className="w-5 h-5" /></Button>
                        </div>
                    </div>

                    <div>
                        <h3 className="text-lg font-semibold mb-2">About this experience</h3>
                        <p className="text-muted-foreground leading-relaxed">{product.description}</p>
                    </div>

                    <div>
                        <h3 className="text-lg font-semibold mb-2">Highlights</h3>
                        <ul className="grid gap-2">
                            {product.highlights.map((highlight, index) => (
                                <li key={index} className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                                    {highlight}
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div className="flex items-center gap-2 text-sm text-muted-foreground pt-4 border-t">
                        <Clock className="w-4 h-4" />
                        <span>Duration: {product.duration}</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
