import { useLocation } from "wouter";
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Badge } from "@/components/ui/badge";
import { MapPin, Clock, Star } from "lucide-react";

// Mock data for products (tours)
const PRODUCTS = [
    {
        id: 1,
        title: "Classic Rome Walking Tour",
        description: "Explore the ancient streets of Rome with our guided audio tour.",
        price: "$19.99",
        image: "https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=800&q=80",
        rating: 4.8,
        duration: "2 hours",
        location: "Rome, Italy",
        tags: ["Best Seller", "Walking"]
    },
    {
        id: 2,
        title: "Paris Louvre Museum Guide",
        description: "Navigate the vast Louvre museum with ease and learn about masterpieces.",
        price: "$24.99",
        image: "https://images.unsplash.com/photo-1499856871940-a09627c6d7db?w=800&q=80",
        rating: 4.9,
        duration: "3 hours",
        location: "Paris, France",
        tags: ["Museum", "Indoor"]
    },
    {
        id: 3,
        title: "London Royal Palaces",
        description: "Discover the history of London's most famous royal residences.",
        price: "$15.99",
        image: "https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=800&q=80",
        rating: 4.7,
        duration: "1.5 hours",
        location: "London, UK",
        tags: ["History", "Royal"]
    },
    {
        id: 4,
        title: "Tokyo Digital Art Museum",
        description: "Immerse yourself in the digital art world of Tokyo.",
        price: "$29.99",
        image: "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=800&q=80",
        rating: 5.0,
        duration: "2.5 hours",
        location: "Tokyo, Japan",
        tags: ["Art", "Modern"]
    }
];

export default function ProductList() {
    const [, setLocation] = useLocation();

    return (
        <div className="container mx-auto py-8 text-foreground">
            <div className="mb-8">
                <h1 className="text-3xl font-bold tracking-tight mb-2">Explore Tours</h1>
                <p className="text-muted-foreground">Discover the world's best audio guided tours.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {PRODUCTS.map((product) => (
                    <Card key={product.id} className="overflow-hidden hover:shadow-lg transition-shadow duration-300">
                        <div className="p-0">
                            <AspectRatio ratio={16 / 9}>
                                <img
                                    src={product.image}
                                    alt={product.title}
                                    className="object-cover w-full h-full"
                                />
                            </AspectRatio>
                        </div>
                        <CardHeader className="p-4 pb-2">
                            <div className="flex justify-between items-start mb-2">
                                <div className="flex gap-2 flex-wrap">
                                    {product.tags.map(tag => (
                                        <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>
                                    ))}
                                </div>
                                <div className="flex items-center text-yellow-500 text-sm font-medium">
                                    <Star className="w-4 h-4 mr-1 fill-current" />
                                    {product.rating}
                                </div>
                            </div>
                            <CardTitle className="line-clamp-1">{product.title}</CardTitle>
                            <CardDescription className="line-clamp-2 mt-1">
                                {product.description}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="p-4 pt-0">
                            <div className="flex items-center gap-4 text-sm text-muted-foreground mt-2">
                                <div className="flex items-center">
                                    <Clock className="w-4 h-4 mr-1" />
                                    {product.duration}
                                </div>
                                <div className="flex items-center">
                                    <MapPin className="w-4 h-4 mr-1" />
                                    {product.location}
                                </div>
                            </div>
                        </CardContent>
                        <CardFooter className="p-4 pt-0 flex items-center justify-between mt-auto">
                            <span className="text-lg font-bold text-primary">{product.price}</span>
                            <Button size="sm" onClick={() => setLocation(`/product/${product.id}`)}>
                                View Details
                            </Button>
                        </CardFooter>
                    </Card>
                ))}
            </div>
        </div>
    );
}
