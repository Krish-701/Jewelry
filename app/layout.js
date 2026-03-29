import { Inter, Playfair_Display } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";

const inter = Inter({
    subsets: ["latin"],
    variable: "--font-inter",
    weight: ["300", "400", "500", "600", "700", "800", "900"],
});

const playfair = Playfair_Display({
    subsets: ["latin"],
    variable: "--font-playfair",
    weight: ["700"],
    style: ["normal", "italic"],
});

export const metadata = {
    title: "Premium Jewelry Model Studio",
    description:
        "Upload your jewelry photos and see them on stunning models with AI-powered photorealistic generation. South Indian, North Indian, American & custom templates.",
    keywords: "jewelry AI, virtual try-on, photorealistic, jewelry model photos, gemini AI jewelry",
};

export default function RootLayout({ children }) {
    return (
        <html lang="en" className={`${inter.variable} ${playfair.variable}`}>
            <body>
                <Header />
                <main>{children}</main>
            </body>
        </html>
    );
}
