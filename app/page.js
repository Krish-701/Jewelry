import Link from 'next/link';

export default function HomePage() {
    return (
        <>
            {/* Hero Section */}
            <section className="hero">
                <div className="hero-content">
                    <div className="hero-badge">
                        Refined by Intelligent AI Imaging ⭐
                    </div>
                    <h1>
                        Transform Jewelry Photos into{' '}
                        <span className="gradient-text">Stunning Model Shots</span>
                    </h1>
                    <p>
                        Upload your jewelry, choose a cultural template, and let AI create
                        photorealistic images of models wearing your pieces. South Indian,
                        North Indian, American & custom styles.
                    </p>
                    <div className="hero-buttons">
                        <Link href="/studio" className="btn btn-primary">
                            ✦ Open Studio
                        </Link>

                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section className="features">
                <div className="container">
                    <div className="section-header">
                        <h2>How It <span className="gradient-text">Works</span></h2>
                        <p>
                            From raw jewelry photo to magazine-ready model shot in minutes
                        </p>
                    </div>

                    <div className="features-grid">
                        <div className="glass-card feature-card">
                            <div className="feature-icon">📸</div>
                            <h3>Upload Jewelry</h3>
                            <p>
                                Drag & drop up to 10 jewelry photos. We support necklaces,
                                earrings, rings, bracelets, and full sets.
                            </p>
                        </div>

                        <div className="glass-card feature-card">
                            <div className="feature-icon">🔍</div>
                            <h3>AI Analysis</h3>
                            <p>
                                Our AI identifies the jewelry type, materials, stones, colors,
                                and style to craft the perfect generation prompt.
                            </p>
                        </div>

                        <div className="glass-card feature-card">
                            <div className="feature-icon">🎭</div>
                            <h3>Choose Template</h3>
                            <p>
                                Select from South Indian, North Indian, American, European, or
                                create your own custom model template.
                            </p>
                        </div>

                        <div className="glass-card feature-card">
                            <div className="feature-icon">✨</div>
                            <h3>Generate Magic</h3>
                            <p>
                                Our AI engine creates photorealistic 2K images of models
                                wearing your exact jewelry with stunning detail.
                            </p>
                        </div>

                        <div className="glass-card feature-card">
                            <div className="feature-icon">💾</div>
                            <h3>Download & Use</h3>
                            <p>
                                Download high-resolution results ready for your product catalog,
                                social media, or e-commerce store.
                            </p>
                        </div>

                        <div className="glass-card feature-card">
                            <div className="feature-icon">🔄</div>
                            <h3>Dual API Support</h3>
                            <p>
                                Seamlessly switch between Google Gemini direct and muapi.ai
                                backends — choose speed or cost.
                            </p>
                        </div>
                    </div>
                </div>
            </section>
        </>
    );
}
