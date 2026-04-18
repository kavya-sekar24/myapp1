import React, { useState, createContext, useContext, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import {
    ShoppingCart, User as UserIcon, LogOut, Package, Calendar,
    Settings, Truck, Archive, AlertCircle, BarChart3,
    Trash2, Plus, Home as HomeIcon, CheckCircle, XCircle,
    ShoppingBag, ArrowRight, Layers, CreditCard,
    Search, Filter, ChevronRight, MapPin, Phone, Mail,
    Clock, Check, Info, Download, ExternalLink, Menu, Sun, MessageCircle, TrendingUp
} from 'lucide-react';
import { storage } from './firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

// --- AUTH SYSTEM ---
const AuthContext = createContext(null);

const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(() => {
        try {
            const saved = localStorage.getItem('user');
            return saved ? JSON.parse(saved) : null;
        } catch (e) {
            return null;
        }
    });

    const login = async (email, password) => {
        try {
            const res = await fetch('http://localhost:5000/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });
            const data = await res.json();
            if (res.ok) {
                const userData = { ...data.user, token: data.token, username: data.user.name }; // Mapping name to username for existing UI
                setUser(userData);
                localStorage.setItem('user', JSON.stringify(userData));
                return { success: true };
            }
            return { success: false, message: data.message };
        } catch (e) {
            return { success: false, message: 'Server error' };
        }
    };

    const signup = async (formData) => {
        try {
            const res = await fetch('http://localhost:5000/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });
            const data = await res.json();
            if (res.ok) return { success: true };
            return { success: false, message: data.message };
        } catch (e) {
            return { success: false, message: 'Server error' };
        }
    };

    const authorizedFetch = async (url, options = {}) => {
        if (!user || !user.token) return { success: false, message: 'Not authenticated' };
        try {
            const res = await fetch(url, {
                ...options,
                headers: {
                    ...options.headers,
                    'Authorization': `Bearer ${user.token}`,
                    'Content-Type': 'application/json'
                }
            });

            let data;
            const contentType = res.headers.get("content-type");
            if (contentType && contentType.includes("application/json")) {
                data = await res.json();
            } else {
                const text = await res.text();
                return { success: false, message: `Server error: ${res.status} ${res.statusText}` };
            }

            if (res.ok) return { success: true, data };
            return { success: false, message: data.message || `Error ${res.status}` };
        } catch (e) {
            console.error("Fetch Error:", e);
            return { success: false, message: `Network error: ${e.message}` };
        }
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem('user');
    };

    const googleLogin = async () => {
        try {
            const { auth, googleProvider } = await import('./firebase');
            const { signInWithPopup } = await import('firebase/auth');
            const result = await signInWithPopup(auth, googleProvider);
            const user = result.user;

            const res = await fetch('http://localhost:5000/api/auth/google', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: user.email, name: user.displayName, uid: user.uid })
            });
            const data = await res.json();
            if (res.ok) {
                const userData = { ...data.user, token: data.token, username: data.user.name };
                setUser(userData);
                localStorage.setItem('user', JSON.stringify(userData));
                return { success: true };
            }
            return { success: false, message: data.message };
        } catch (error) {
            return { success: false, message: 'Google Sign-In failed or was cancelled.' };
        }
    };

    return <AuthContext.Provider value={{ user, login, signup, logout, authorizedFetch, googleLogin }}>{children}</AuthContext.Provider>;
};

const useAuth = () => useContext(AuthContext);

const ProtectedRoute = ({ children, role }) => {
    const { user } = useAuth();
    if (!user) return <Navigate to="/login" replace />;
    if (role && user.role !== role) return <Navigate to="/" replace />;
    return children;
};

// --- DATA REPOSITORY ---
const INITIAL_PRODUCTS = [
    {
        _id: '1',
        product_name: 'Cold Pressed Coconut Oil (With Sulphur)',
        category: 'Coconut Oils',
        description: 'Traditional wood-pressed coconut oil infused with purified sulphur for scalp therapy.',
        price: 180,
        stock_quantity: 50,
        image_url: '/img2.jpg',
        sizes: ['250ml', '500ml', '1L'],
        benefits: ['Reduces Dandruff', 'Scalp Care'],
        itemType: 'sale'
    },
    {
        _id: '2',
        product_name: 'Cold Pressed Coconut Oil (Without Sulphur)',
        category: 'Coconut Oils',
        description: '100% pure virgin wood-pressed coconut oil for cooking and body care.',
        price: 420,
        stock_quantity: 60,
        image_url: '/img3.jpg',
        sizes: ['500ml', '1L', '5L'],
        benefits: ['Purity Guaranteed', 'Multi-purpose'],
        itemType: 'sale'
    },
    {
        _id: '3',
        product_name: 'Baby Coconut Oil',
        category: 'Personal Care',
        description: 'Ultra-mild filtered coconut oil for delicate baby skin.',
        price: 220,
        stock_quantity: 30,
        image_url: '/img10.jpg',
        sizes: ['100ml', '200ml'],
        benefits: ['Skin Friendly', 'No Additives'],
        itemType: 'sale'
    },
    {
        _id: '4',
        product_name: 'Coconut Shell Bird Nest',
        category: 'Eco Products',
        description: 'Sustainable coconut shell bird feeders and nests.',
        price: 149,
        stock_quantity: 40,
        image_url: '/img6.jpeg',
        sizes: ['Small', 'Medium'],
        benefits: ['Eco Friendly', 'Handcrafted'],
        itemType: 'sale'
    },
    {
        _id: '5',
        product_name: 'Coconut Shell Bowl',
        category: 'Kitchenware',
        description: 'Polished shell bowls for organic dining experience.',
        price: 120,
        stock_quantity: 25,
        image_url: '/img7.jpg',
        sizes: ['Medium'],
        benefits: ['Unique Texture', 'Food Safe'],
        itemType: 'sale'
    },
    {
        _id: '6',
        product_name: 'Coconut Shell Bulk (Wholesale)',
        category: 'Industrial',
        description: 'Raw coconut shells in bulk for industrial use or large-scale crafting.',
        price: 500,
        stock_quantity: 100,
        image_url: '/img11.jpg',
        sizes: ['10kg', '50kg'],
        benefits: ['Bulk Savings', 'Industrial Grade'],
        itemType: 'sale'
    }
];

const INITIAL_RENTALS = [
    {
        id: 101,
        name: 'Industrial Drying Mats',
        price: 50,
        type: 'Day',
        status: 'Available',
        category: 'Drying',
        specs: { material: 'Heavy Duty HDPE', size: '10x10 ft', durability: 'High' },
        desc: 'Premium quality mats designed for optimal copra sun-drying. Heat resistant and easy to clean.'
    },
    {
        id: 102,
        name: 'Coconut Cutting Machine',
        price: 800,
        type: 'Day',
        status: 'Available',
        category: 'Processing',
        specs: { power: '2HP Electric', capacity: '300 units/hr', safety: 'Covered Blade' },
        desc: 'Efficient semi-automatic machine for precise coconut splitting and preparation.'
    }
];

// --- MODULE COMPONENTS ---

const Navbar = ({ cartCount }) => {
    const { user, logout } = useAuth();
    return (
        <nav className="navbar">
            <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                <Link to="/" className="logo">SHRI THIRUMURUGAN<span style={{ color: '#333' }}> OIL MILL</span></Link>
                <div className="nav-links">
                    <Link to="/">Home</Link>
                    <Link to="/products">Products</Link>
                    <Link to="/booking">Yard Booking</Link>
                    <Link to="/rental">Equipment</Link>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
                    <Link to="/cart" style={{ position: 'relative', color: '#1A1A1A' }}>
                        <ShoppingCart size={22} />
                        {cartCount > 0 && <span style={{ position: 'absolute', top: '-10px', right: '-10px', background: 'var(--primary)', color: 'white', borderRadius: '50%', width: '18px', height: '18px', fontSize: '0.65rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{cartCount}</span>}
                    </Link>
                    {user ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <Link to="/profile" style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--primary)', textDecoration: 'none' }}>{user.name || 'My Account'}</Link>
                            {user.role === 'ADMIN' ? <Link to="/admin" className="btn btn-primary" style={{ padding: '8px 16px', fontSize: '0.8rem' }}>Admin Panel</Link> : <button onClick={logout} className="btn btn-outline" style={{ padding: '8px 16px', fontSize: '0.8rem' }}>Logout</button>}
                        </div>
                    ) : (
                        <div style={{ display: 'flex', gap: '12px' }}>
                            <Link to="/login" className="btn btn-outline" style={{ padding: '8px 20px', fontSize: '0.85rem' }}>Sign In</Link>
                            <Link to="/signup" className="btn btn-primary" style={{ padding: '8px 20px', fontSize: '0.85rem' }}>Sign Up</Link>
                        </div>
                    )}
                </div>
            </div>
        </nav>
    );
};

const Footer = () => (
    <footer style={{ background: '#1A1A1A', color: '#FFF', padding: '80px 0 40px' }}>
        <div className="container" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '40px', marginBottom: '60px' }}>
            <div>
                <h2 style={{ color: '#FFF', marginBottom: '24px' }}>SHRI THIRUMURUGAN</h2>
                <p style={{ color: '#999', lineHeight: '1.8' }}>Premium traditional oil production and supporting farm services since 1985. Committed to purity and natural standards.</p>
            </div>
            <div>
                <h4 style={{ marginBottom: '24px' }}>Modules</h4>
                <ul style={{ listStyle: 'none', color: '#999', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <li><Link to="/products" style={{ color: 'inherit', textDecoration: 'none' }}>Oil Products</Link></li>
                    <li><Link to="/booking" style={{ color: 'inherit', textDecoration: 'none' }}>Drying Yards</Link></li>
                    <li><Link to="/rental" style={{ color: 'inherit', textDecoration: 'none' }}>Equipment Rental</Link></li>
                </ul>
            </div>
            <div>
                <h4 style={{ marginBottom: '24px' }}>Help & Support</h4>
                <ul style={{ listStyle: 'none', color: '#999', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <li>Privacy Policy</li>
                    <li>Orders Tracking</li>
                    <li>Customer Support</li>
                </ul>
            </div>
            <div>
                <h4 style={{ marginBottom: '24px' }}>Factory Location</h4>
                <p style={{ color: '#999', display: 'flex', alignItems: 'flex-start', gap: '8px' }}><MapPin size={18} style={{ flexShrink: 0, marginTop: '4px' }} /> 17/33, M.P.M NAGAR, KANGEYAM, Tiruppur, Tamil Nadu, 638701</p>
                <p style={{ color: '#999', margin: '12px 0' }}><Phone size={18} /> +91 98765 43210</p>
                <p style={{ color: '#999' }}><Mail size={18} /> contact@shrithirumuruganoilmill.com</p>
            </div>
        </div>
        <div className="container" style={{ borderTop: '1px solid #333', paddingTop: '40px', textAlign: 'center', color: '#555', fontSize: '0.9rem' }}>
            &copy; 2026 Shri Thirumurugan Oil Mill. All rights reserved. Professional Academic Prototype.
        </div>
    </footer>
);

// --- PAGES ---

const HomePage = ({ onAdd }) => (
    <>
        <header className="hero-split">
            <div className="hero-image-full animate-scale-in" style={{ background: 'url(/img1.webp) center/contain no-repeat', backgroundColor: '#F9FBF9' }}></div>
            <div className="hero-content animate-fade-up">
                <div className="hero-text-inner">
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '6px 12px', background: 'rgba(46, 125, 50, 0.1)', borderRadius: '100px', color: 'var(--primary)', fontWeight: 800, fontSize: '0.8rem', marginBottom: '24px' }}><Check size={16} /> ISO 9001:2015 CERTIFIED NATURAL MILLED OIL</div>
                    <h1 style={{ letterSpacing: '-0.03em' }}>Pure Essence of <span style={{ color: 'var(--primary)', position: 'relative' }}>Tradition</span>.</h1>
                    <p>Straight from our traditional mill to your home — enjoy the authentic purity of cold-pressed oils and handcrafted coconut shell creations.</p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px' }}>
                        <Link to="/products" className="btn btn-primary" style={{ padding: '16px 32px' }}>Explore products <ArrowRight size={18} /></Link>
                        <Link to="/login" className="btn btn-outline" style={{ padding: '16px 32px', borderColor: '#E0E0E0', color: '#333' }}>Mill Portal Access</Link>
                    </div>
                </div>
            </div>
        </header>

        <section style={{ background: 'var(--bg-sub)', padding: '120px 0' }}>
            <div className="container">
                <div className="section-header animate-fade-up">
                    <h2 style={{ fontSize: '3rem' }}>The Extraction Journey</h2>
                    <p>Honoring the age-old traditions of Kangeyam to bring you pure, cold-pressed excellence.</p>
                </div>
                <div className="process-grid">
                    {[
                        { s: 'Harvesting', d: 'Premium mature coconuts sourced from the finest groves of Tamil Nadu.', i: '01' },
                        { s: 'Sun-Drying', d: 'Natural conversion to copra in our precisely managed drying yards.', i: '02' },
                        { s: 'Extraction', d: 'Traditional cold-pressing without heat to retain nutrients.', i: '03' },
                        { s: 'Quality Seal', d: 'Triple-filtration process ensuring 100% purity and shelf-life.', i: '04' }
                    ].map((p, i) => (
                        <div key={i} className={`process-step animate-fade-up delay-${i + 1}`}>
                            <div className="step-icon">{p.i}</div>
                            <h4 style={{ fontSize: '1.25rem', fontWeight: 800 }}>{p.s}</h4>
                            <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>{p.d}</p>
                            {i < 3 && (
                                <div className="connector-arrow">
                                    <ArrowRight size={32} strokeWidth={1} />
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </section>

    </>
);

const ProductCard = ({ product, onAdd }) => {
    const [qty, setQty] = useState(1);
    const [size, setSize] = useState(product.sizes?.[0] || 'Standard');

    const handleAdd = () => {
        onAdd({ ...product, quantity: qty, selectedSize: size });
    };

    return (
        <div className="product-card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="product-img-box" style={{ overflow: 'hidden', height: '200px' }}>
                <img src={product.image_url || product.image || product.img} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt={product.product_name || product.name} />
            </div>

            <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ fontSize: '0.7rem', textTransform: 'uppercase', fontWeight: 800, color: 'var(--primary)', background: 'rgba(46, 125, 50, 0.1)', padding: '4px 8px', borderRadius: '4px' }}>{product.category}</span>
                    {((product.stock_quantity || product.stock) <= 5 && (product.stock_quantity || product.stock) > 0) && <span style={{ fontSize: '0.7rem', color: 'var(--danger)', fontWeight: 700 }}>Only {product.stock_quantity || product.stock} left</span>}
                </div>

                <h3 style={{ fontSize: '1.2rem', marginBottom: '12px' }}>{product.product_name || product.name}</h3>

                <div className="data-card" style={{ padding: '12px', background: '#F9FBF9', border: 'none', marginBottom: '16px' }}>
                    <p style={{ fontSize: '0.85rem', color: '#666', lineHeight: 1.4, marginBottom: '8px' }}>{product.description || product.desc}</p>
                    <ul style={{ paddingLeft: '16px', fontSize: '0.8rem', color: 'var(--primary)' }}>
                        {(product.benefits || []).map((b, i) => <li key={i}>{b}</li>)}
                    </ul>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <label style={{ fontSize: '0.8rem', fontWeight: 700 }}>Select Size:</label>
                        <select
                            value={size}
                            onChange={(e) => setSize(e.target.value)}
                            style={{ padding: '4px 8px', borderRadius: '6px', border: '1px solid #DDD', fontSize: '0.85rem' }}
                        >
                            {(product.sizes || ['Standard']).map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                    </div>
                </div>

                <p style={{ color: 'var(--primary)', fontWeight: 800, fontSize: '1.4rem', marginBottom: '20px' }}>₹{product.price}.00</p>

                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #DDD', borderRadius: '8px', overflow: 'hidden' }}>
                        <button onClick={() => setQty(Math.max(1, qty - 1))} style={{ padding: '8px 12px', background: 'none', border: 'none', cursor: 'pointer' }}>-</button>
                        <input
                            type="number"
                            value={qty}
                            onChange={(e) => setQty(Math.max(1, parseInt(e.target.value) || 1))}
                            style={{ width: '40px', textAlign: 'center', border: 'none', fontSize: '0.9rem', outline: 'none' }}
                        />
                        <button onClick={() => setQty(Math.min(product.stock || 99, qty + 1))} style={{ padding: '8px 12px', background: 'none', border: 'none', cursor: 'pointer' }}>+</button>
                    </div>
                    <button className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }} onClick={handleAdd}>Add to Cart</button>
                </div>
                {qty >= 10 && <p style={{ fontSize: '0.75rem', color: 'var(--primary)', marginTop: '8px', fontWeight: 600 }}>Bulk order pricing may apply</p>}
            </div>
        </div>
    );
};

const ProductsPage = ({ onAdd }) => {
    const [category, setCategory] = useState('All');
    const [products, setProducts] = useState([]);

    useEffect(() => {
        const fetchProducts = async () => {
            try {
                const res = await fetch('http://localhost:5000/api/products');
                const data = await res.json();
                if (res.ok) setProducts(data);
            } catch (e) { console.error('Failed to fetch products'); }
        };
        fetchProducts();
    }, []);

    const categories = ['All', 'Coconut Oils', 'Hair & Skin Oils', 'Kitchen Shell Products', 'Home Decor', 'Eco & Industrial Products'];

    const filteredProducts = category === 'All'
        ? products
        : products.filter(p => p.category === category);

    return (
        <div className="container" style={{ padding: '40px 0' }}>
            {/* --- PREMIUM PRODUCT HEADER --- */}
            <div className="glass-card animate-fade-up" style={{ display: 'flex', flexWrap: 'wrap', gap: '40px', alignItems: 'center', marginBottom: '80px', background: 'linear-gradient(135deg, #F5F0E6 0%, #FFFFFF 100%)', border: '1px solid rgba(46, 125, 50, 0.1)' }}>
                <div style={{ flex: 1, minWidth: '300px' }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: 'var(--primary)', fontWeight: 800, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '16px' }}><Archive size={16} /> Artisan Store</div>
                    <h1 style={{ fontSize: '2.5rem', marginBottom: '20px' }}>The Traditional <span style={{ color: 'var(--primary)' }}>Collective</span></h1>
                    <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem', lineHeight: 1.6 }}>Straight from our traditional mill to your home — enjoy the authentic purity of cold-pressed oils and handcrafted coconut shell creations.</p>
                </div>
                <div style={{ width: '280px', height: '200px', borderRadius: '16px', background: 'url(/img1.webp) center/cover', flexShrink: 0 }}></div>
            </div>

            <div style={{ marginBottom: '60px' }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', justifyContent: 'center' }}>
                    {categories.map(cat => (
                        <button
                            key={cat}
                            onClick={() => setCategory(cat)}
                            className={`btn ${category === cat ? 'btn-primary' : 'btn-outline'}`}
                            style={{ padding: '10px 20px', fontSize: '0.85rem' }}
                        >
                            {cat}
                        </button>
                    ))}
                </div>
            </div>

            <div className="product-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))' }}>
                {filteredProducts.map(p => (
                    <ProductCard key={p._id || p.id} product={p} onAdd={onAdd} />
                ))}
            </div>

            {filteredProducts.length === 0 && (
                <div style={{ textAlign: 'center', padding: '100px 0' }}>
                    <p style={{ color: '#999' }}>Coming soon: New products arriving in this category.</p>
                </div>
            )}
        </div>
    );
};

const BookingPage = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Normalize today for comparisons

    const [viewDate, setViewDate] = useState(new Date()); // Controls the month/year view
    const [selectedDate, setSelectedDate] = useState(new Date().getDate());
    const { user, authorizedFetch } = useAuth();
    const navigate = useNavigate();

    // Mock 2-Acre Total Capacity Slots
    const INITIAL_YARD_DATA = [
        { id: 1, name: 'Heritage Small Yard', area: '0.25 Acre', price: 250, desc: 'Optimized for small-batch boutique oil production.' },
        { id: 2, name: 'Farmer Collective Space', area: '0.50 Acre', price: 450, desc: 'Spacious area designed for multi-farmer harvests.' },
        { id: 3, name: 'Primary Mill Floor', area: '1.00 Acre', price: 850, desc: 'Central drying zone with highest heat retention.' },
        { id: 4, name: 'Express Micro Zone', area: '0.25 Acre', price: 300, desc: 'Premium edge zone for quick-load processing.' }
    ];

    const [activeSlots, setActiveSlots] = useState(INITIAL_YARD_DATA);
    const [selectedSlot, setSelectedSlot] = useState(null);
    const [isBooked, setIsBooked] = useState(false);
    const [bookingLoading, setBookingLoading] = useState(false);
    const [availabilityLoading, setAvailabilityLoading] = useState(false);

    const currentMonthLabel = viewDate.toLocaleString('default', { month: 'long' });
    const currentYear = viewDate.getFullYear();
    const currentMonth = viewDate.getMonth();
    
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const calendarDays = Array.from({ length: daysInMonth }, (_, i) => i + 1);

    const isDatePast = (dateNum) => {
        const checkDate = new Date(currentYear, currentMonth, dateNum);
        return checkDate < today;
    };

    const changeMonth = (offset) => {
        const nextDate = new Date(currentYear, currentMonth + offset, 1);
        setViewDate(nextDate);
        setSelectedDate(1); // Reset selected date when changing month
    };

    // Fetch availability when date changes
    useEffect(() => {
        const fetchAvailability = async () => {
            setAvailabilityLoading(true);
            try {
                // Use UTC to avoid timezone shift inconsistencies
                const dateStr = new Date(Date.UTC(currentYear, currentMonth, selectedDate)).toISOString();
                const res = await fetch(`http://localhost:5000/api/bookings/availability?date=${dateStr}`);
                const bookedData = await res.json();
                
                if (res.ok) {
                    const updatedSlots = INITIAL_YARD_DATA.map(slot => {
                        const isBookedOnDate = bookedData.some(b => b.yardName === slot.name);
                        return { 
                            ...slot, 
                            status: isBookedOnDate ? 'Booked' : 'Available' 
                        };
                    });
                    setActiveSlots(updatedSlots);
                    if (selectedSlot && updatedSlots.find(s => s.id === selectedSlot)?.status === 'Booked') {
                        setSelectedSlot(null);
                    }
                }
            } catch (e) {
                console.error('Failed to fetch availability', e);
            } finally {
                setAvailabilityLoading(false);
            }
        };
        fetchAvailability();
    }, [selectedDate, currentYear, currentMonth]);

    const handleBooking = async () => {
        if (!user) { alert('Please login to book a yard.'); navigate('/login'); return; }
        if (!selectedSlot) { alert('Please select a yard slot first.'); return; }

        const slot = activeSlots.find(s => s.id === selectedSlot);
        const bookingData = {
            booking_date: new Date(Date.UTC(currentYear, currentMonth, selectedDate)).toISOString(),
            time_slot: 'Full Day',
            areaSize: parseFloat(slot.area),
            yardName: slot.name
        };

        setBookingLoading(true);
        const res = await authorizedFetch('http://localhost:5000/api/bookings', {
            method: 'POST',
            body: JSON.stringify(bookingData)
        });
        setBookingLoading(false);

        if (res.success) {
            setIsBooked(true);
            // Refresh availability immediately
            const updatedSlots = activeSlots.map(s => s.id === selectedSlot ? { ...s, status: 'Booked' } : s);
            setActiveSlots(updatedSlots);
            setTimeout(() => setIsBooked(false), 6000);
        } else {
            alert('Booking failed: ' + (res.message || 'Unknown error'));
        }
    };

    return (
        <div className="booking-page-bg" style={{ padding: '80px 0' }}>
            <div className="container">
                {/* --- HEADER --- */}
                <div className="section-header animate-fade-up">
                    <div className="capacity-indicator shimmer">
                        <Layers size={20} color="var(--primary)" />
                        <span style={{ fontWeight: 800, color: 'var(--primary)', fontSize: '0.9rem' }}>TOTAL FACILITY CAPACITY: 2.0 ACRES</span>
                    </div>
                    <h1 style={{ fontSize: 'clamp(2.5rem, 6vw, 4rem)', fontWeight: 800, letterSpacing: '-2px', marginBottom: '24px' }}>
                        Premium <span style={{ color: 'var(--primary)' }}>Yard Selection</span>
                    </h1>
                    <p style={{ maxWidth: '650px', margin: '0 auto', fontSize: '1.2rem', color: 'var(--text-muted)' }}>
                        Secure a specialized drying zone at our ISO-certified mill. Our 2-acre facility ensures optimal spacing for quality results.
                    </p>
                </div>

                {isBooked && (
                    <div className="animate-fade-up shimmer" style={{ background: 'var(--primary)', color: 'white', padding: '24px', borderRadius: '16px', textAlign: 'center', marginBottom: '40px', boxShadow: '0 20px 40px rgba(46, 125, 50, 0.2)', fontWeight: 700 }}>
                        <CheckCircle size={28} style={{ verticalAlign: 'middle', marginRight: '12px' }} />
                        RESERVATION CONFIRMED: {activeSlots.find(s => s.id === selectedSlot)?.name} for {currentMonthLabel} {selectedDate}!
                    </div>
                )}

                <div className="booking-layout-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: '60px', alignItems: 'start' }}>

                    {/* --- CALENDAR WIDGET --- */}
                    <div className="calendar-widget animate-fade-up" style={{ padding: '40px', borderRadius: '32px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                                <button onClick={() => changeMonth(-1)} className="btn btn-outline" style={{ padding: '8px 12px' }}>&larr;</button>
                                <div style={{ minWidth: '120px' }}>
                                    <h3 style={{ fontSize: '1.5rem', fontWeight: 800 }}>{currentMonthLabel}</h3>
                                    <p style={{ color: '#888', fontSize: '0.9rem' }}>{currentYear} Cycle</p>
                                </div>
                                <button onClick={() => changeMonth(1)} className="btn btn-outline" style={{ padding: '8px 12px' }}>&rarr;</button>
                            </div>
                            <div style={{ padding: '12px', background: 'white', borderRadius: '14px', boxShadow: 'var(--shadow-sm)' }}>
                                <Calendar size={24} color="var(--primary)" />
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '12px', textAlign: 'center' }}>
                            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
                                <div key={`${d}-${i}`} style={{ fontSize: '0.8rem', fontWeight: 800, color: '#AAA', paddingBottom: '16px' }}>{d}</div>
                            ))}
                            {calendarDays.map(date => {
                                const isPast = isDatePast(date);
                                const isSelected = selectedDate === date;
                                return (
                                    <div
                                        key={date}
                                        onClick={() => !isPast && setSelectedDate(date)}
                                        className={`calendar-day ${isSelected ? 'active' : ''}`}
                                        style={{
                                            aspectRatio: '1',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            borderRadius: '14px',
                                            cursor: isPast ? 'default' : 'pointer',
                                            fontSize: '1rem',
                                            fontWeight: isSelected ? 800 : 600,
                                            background: isSelected ? 'var(--primary)' : (isPast ? 'transparent' : 'white'),
                                            color: isSelected ? 'white' : (isPast ? '#EEE' : '#444'),
                                            border: isSelected ? 'none' : '1px solid rgba(0,0,0,0.03)',
                                            boxShadow: isSelected ? '0 8px 16px rgba(46, 125, 50, 0.3)' : 'none',
                                            opacity: isPast ? 0.4 : 1
                                        }}
                                    >
                                        {date}
                                    </div>
                                );
                            })}
                        </div>

                        <div style={{ marginTop: '48px', padding: '24px', borderRadius: '20px', background: 'var(--primary-glow)', border: '1px solid rgba(46, 125, 50, 0.1)', display: 'flex', alignItems: 'center', gap: '16px' }}>
                            <div style={{ width: '48px', height: '48px', background: 'var(--primary)', color: 'white', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                <Clock size={24} style={{ margin: 'auto' }} />
                            </div>
                            <div>
                                <p style={{ fontSize: '0.8rem', color: 'var(--primary-dark)', fontWeight: 700, textTransform: 'uppercase' }}>Selected Window</p>
                                <p style={{ fontSize: '1.2rem', fontWeight: 800 }}>{selectedDate} {currentMonthLabel}, {currentYear}</p>
                            </div>
                        </div>
                    </div>

                    {/* --- SLOTS SECTION --- */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                            <h3 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Available Zones</h3>
                            <span style={{ fontSize: '0.9rem', color: '#888' }}>{activeSlots.filter(s => s.status === 'Available').length} Options</span>
                        </div>

                        {activeSlots.map((slot) => {
                            const isSelected = selectedSlot === slot.id;
                            const isBookedSlot = slot.status === 'Booked';
                            return (
                                <div
                                    key={slot.id}
                                    onClick={() => !isBookedSlot && setSelectedSlot(slot.id)}
                                    className={`slot-selection-card animate-fade-up ${isSelected ? 'selected' : ''} ${isBookedSlot ? 'booked' : ''}`}
                                    style={{
                                        padding: '32px',
                                        background: 'white',
                                        borderRadius: '24px',
                                        cursor: isBookedSlot ? 'default' : 'pointer',
                                        boxShadow: isSelected ? '0 15px 30px rgba(0,0,0,0.08)' : '0 4px 6px rgba(0,0,0,0.02)',
                                        border: isSelected ? '1px solid var(--primary)' : '1px solid rgba(0,0,0,0.03)',
                                        position: 'relative',
                                        transition: 'all 0.4s ease'
                                    }}
                                >
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                                                <h4 style={{ fontSize: '1.3rem', fontWeight: 800 }}>{slot.name}</h4>
                                                <span className="acre-badge">{slot.area}</span>
                                            </div>
                                            <p style={{ fontSize: '0.95rem', color: '#777', lineHeight: 1.5 }}>{slot.desc}</p>
                                        </div>
                                        <div style={{ textAlign: 'right', marginLeft: '20px' }}>
                                            <p style={{ color: 'var(--primary)', fontWeight: 800, fontSize: '1.6rem' }}>₹{slot.price}</p>
                                            <p style={{ fontSize: '0.75rem', color: '#999', textTransform: 'uppercase', fontWeight: 700 }}>Daily Rate</p>
                                        </div>
                                    </div>

                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            {isBookedSlot ? (
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#E53935', fontSize: '0.85rem', fontWeight: 700 }}>
                                                    <XCircle size={16} /> Fully Occupied
                                                </div>
                                            ) : (
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#4CAF50', fontSize: '0.85rem', fontWeight: 700 }}>
                                                    <CheckCircle size={16} /> Ready to Book
                                                </div>
                                            )}
                                        </div>
                                        {isSelected && <div style={{ background: 'var(--primary)', color: 'white', padding: '6px 14px', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 800 }}>PRESELECTED</div>}
                                    </div>
                                </div>
                            );
                        })}

                        <button
                            onClick={handleBooking}
                            className="btn btn-primary shimmer"
                            style={{
                                width: '100%',
                                marginTop: '20px',
                                padding: '24px',
                                justifyContent: 'center',
                                fontSize: '1.25rem',
                                borderRadius: '20px'
                            }}
                            disabled={!selectedSlot || bookingLoading}
                        >
                            {bookingLoading ? 'Submitting...' : <>Confirm Selection <ArrowRight size={22} /></>}
                        </button>
                        {isBooked && (
                            <div style={{ marginTop: '16px', background: '#E8F5E9', border: '1px solid #C8E6C9', borderRadius: '16px', padding: '20px 24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <CheckCircle size={24} color="#2E7D32" />
                                <div>
                                    <p style={{ fontWeight: 800, color: '#2E7D32' }}>Booking Submitted!</p>
                                    <p style={{ fontSize: '0.85rem', color: '#388E3C' }}>Your yard reservation is pending admin approval. Check your profile for updates.</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

const RentalPage = ({ onAdd }) => {
    const [rentals, setRentals] = useState([]);

    useEffect(() => {
        const fetchRentals = async () => {
            try {
                const res = await fetch('http://localhost:5000/api/products');
                const data = await res.json();
                if (res.ok) {
                    const rentalItems = data.filter(item => item.itemType === 'rental');
                    setRentals(rentalItems);
                }
            } catch (e) { console.error('Failed to fetch rentals'); }
        };
        fetchRentals();
    }, []);

    return (
        <div style={{ background: '#F4F7F4', minHeight: '100vh' }}>
            {/* --- RENTAL HERO --- */}
            <div style={{ background: 'linear-gradient(rgba(46, 125, 50, 0.9), rgba(27, 94, 32, 0.9))', padding: '120px 0', textAlign: 'center', color: 'white', marginBottom: '60px' }}>
                <div className="container">
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '8px 20px', background: 'rgba(255,255,255,0.2)', borderRadius: '100px', fontSize: '0.85rem', fontWeight: 800, marginBottom: '24px' }}>
                        <Truck size={16} /> ESSENTIAL MILLING TOOLS
                    </div>
                    <h1 style={{ fontSize: 'clamp(3rem, 7vw, 5rem)', fontWeight: 800, letterSpacing: '-3px', marginBottom: '16px' }}>Mill <span style={{ color: 'var(--accent)' }}>Equipment</span></h1>
                    <p style={{ maxWidth: '700px', margin: '0 auto', fontSize: '1.25rem', opacity: 0.9 }}>Reliable equipment for your copra processing and drying needs.</p>
                </div>
            </div>

            <div className="container">
                {/* --- EQUIPMENT GRID --- */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '32px', paddingBottom: '100px' }}>
                    {rentals.map(r => (
                        <div key={r._id || r.id} className="data-card animate-fade-up" style={{ border: '1px solid rgba(46, 125, 50, 0.1)', position: 'relative' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                                <div>
                                    <span style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--primary)', background: 'rgba(46, 125, 50, 0.1)', padding: '4px 12px', borderRadius: '100px' }}>{r.category}</span>
                                    <h3 style={{ fontSize: '1.8rem', marginTop: '12px' }}>{r.name || r.product_name}</h3>
                                </div>
                                <div style={{ background: '#4CAF50', color: 'white', padding: '6px 14px', borderRadius: '100px', fontSize: '0.75rem', fontWeight: 800 }}>
                                    {r.status || 'Available'}
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '24px' }}>
                                {Object.entries(r.specs || {}).map(([key, value]) => (
                                    <div key={key} style={{ background: '#F8F9F8', padding: '12px', borderRadius: '14px', textAlign: 'center', border: '1px solid #F0F0F0' }}>
                                        <p style={{ fontSize: '0.65rem', color: '#999', textTransform: 'uppercase', fontWeight: 700, marginBottom: '4px' }}>{key}</p>
                                        <p style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--primary)' }}>{value}</p>
                                    </div>
                                ))}
                            </div>

                            <p style={{ fontSize: '1rem', color: '#666', marginBottom: '32px', lineHeight: 1.6 }}>{r.description || r.desc}</p>

                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '24px', borderTop: '1px solid #F0F0F0' }}>
                                <div>
                                    <p style={{ fontSize: '1.8rem', fontWeight: 900, color: 'var(--text-main)' }}>₹{r.price}<span style={{ fontSize: '1rem', opacity: 0.5, fontWeight: 500 }}>/{r.rentalPeriod || r.type}</span></p>
                                </div>
                                <button className="btn btn-primary" style={{ padding: '14px 32px' }} onClick={() => {
                                    if (onAdd) {
                                        onAdd({ ...r, _id: r._id + '-rental' }, 1, r.rentalPeriod || r.type);
                                        alert(`${r.name || r.product_name} added to cart for reservation!`);
                                    }
                                }}>Reserve Equipment</button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

const CartPage = ({ cart, onRemove, onClear }) => {
    const { user, authorizedFetch } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [showMockPay, setShowMockPay] = useState(false);

    const total = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);

    const finishOrder = async (paymentData) => {
        setLoading(true);
        const orderData = {
            products: cart.map(item => ({
                product: item._id,
                quantity: item.quantity,
                priceAtTime: item.price
            })),
            total_amount: total,
            shippingAddress: { street: 'Main Mill Road', city: 'Tiruppur', state: 'Tamil Nadu', zip: '641601' },
            paymentDetails: paymentData
        };

        const dbRes = await authorizedFetch('http://localhost:5000/api/orders', {
            method: 'POST',
            body: JSON.stringify(orderData)
        });

        if (dbRes.success) {
            alert('Order placed successfully! Transaction recorded in MongoDB.');
            onClear();
            navigate('/profile');
        } else {
            alert('Payment received but database sync failed.');
        }
        setLoading(false);
        setShowMockPay(false);
    };

    const handleCheckout = async () => {
        if (!user) { alert('Please login to checkout.'); navigate('/login'); return; }
        if (cart.length === 0) return;

        // FORCING MOCK RAZORPAY AS REQUESTED
        setShowMockPay(true);
    };
    return (
        <div className="container" style={{ padding: '40px 0' }}>
            <h1 className="section-title">Your Shopping Bag</h1>
            {cart.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '60px 0' }}>
                    <ShoppingBag size={64} style={{ opacity: 0.1, marginBottom: '24px' }} />
                    <p style={{ color: '#999' }}>Your cart is currently empty.</p>
                    <Link to="/products" className="btn btn-primary" style={{ marginTop: '24px' }}>Browse Products</Link>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        {cart.map((item, idx) => (
                            <div key={idx} className="data-card" style={{ display: 'flex', gap: '20px', alignItems: 'center', flexWrap: 'wrap' }}>
                                <div style={{ width: '80px', height: '80px', borderRadius: '12px', background: `url(${item.img}) center/cover`, flexShrink: 0 }}></div>
                                <div style={{ flex: 1, minWidth: '200px' }}>
                                    <h4 style={{ fontSize: '1.1rem' }}>{item.product_name || item.name}</h4>
                                    <p style={{ fontSize: '0.85rem', color: '#666' }}>Size: {item.selectedSize} | Qty: {item.quantity}</p>
                                    <p style={{ color: 'var(--primary)', fontWeight: 800 }}>₹{item.price * item.quantity}.00</p>
                                </div>
                                <button onClick={() => onRemove(idx)} style={{ background: 'none', border: 'none', color: 'red', cursor: 'pointer', padding: '12px' }}><Trash2 size={24} /></button>
                            </div>
                        ))}
                    </div>
                    <div className="data-card" style={{ height: 'fit-content' }}>
                        <h3 style={{ marginBottom: '24px' }}>Order Summary</h3>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}><span>Subtotal</span><span>₹{total}.00</span></div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}><span>Mill Shipping</span><span style={{ color: 'var(--primary)' }}>FREE</span></div>
                        <hr style={{ margin: '24px 0', opacity: 0.1 }} />
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '32px', fontWeight: 800, fontSize: '1.5rem' }}><span>Total</span><span>₹{total}.00</span></div>
                        <button className="btn btn-primary" onClick={handleCheckout} disabled={loading} style={{ width: '100%', padding: '18px', justifyContent: 'center', fontSize: '1.1rem' }}>
                            {loading ? 'Processing...' : 'Proceed to Payment'}
                        </button>
                    </div>
                </div>
            )}
            {showMockPay && (
                <RazorpayMock
                    amount={total}
                    onPaymentSuccess={finishOrder}
                    onCancel={() => setShowMockPay(false)}
                />
            )}
        </div>
    );
};

const ProfilePage = () => {
    const { user, authorizedFetch, logout } = useAuth();
    const [orders, setOrders] = useState([]);
    const [bookings, setBookings] = useState([]);

    useEffect(() => {
        const fetchHistory = async () => {
            const orderRes = await authorizedFetch('http://localhost:5000/api/orders/my');
            if (orderRes.success) setOrders(orderRes.data);

            const bookingRes = await authorizedFetch('http://localhost:5000/api/bookings/my');
            if (bookingRes.success) setBookings(bookingRes.data);
        };
        if (user) fetchHistory();
    }, [user]);

    if (!user) return <Navigate to="/login" />;

    return (
        <div className="container" style={{ padding: '80px 0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '48px' }}>
                <div>
                    <h1 style={{ fontSize: '2.5rem', marginBottom: '8px' }}>Welcome, {user.name}</h1>
                    <p style={{ color: '#666' }}>Manage your orders, bookings, and account settings.</p>
                </div>
                <button onClick={logout} className="btn btn-outline" style={{ color: 'red', borderColor: 'red' }}>Logout</button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '40px' }}>
                {/* --- ORDER HISTORY --- */}
                <div className="data-card">
                    <h3 style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px' }}><Package color="var(--primary)" /> Recent Orders</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        {orders.map(o => (
                            <div key={o._id} style={{ padding: '16px', border: '1px solid #F0F0F0', borderRadius: '12px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                    <span style={{ fontWeight: 800 }}>Order #{o._id.slice(-6).toUpperCase()}</span>
                                    <span style={{ fontSize: '0.75rem', padding: '4px 10px', background: '#F0F0F0', borderRadius: '100px' }}>{o.order_status || o.orderStatus}</span>
                                </div>
                                <p style={{ fontSize: '0.85rem', color: '#666' }}>{new Date(o.createdAt).toLocaleDateString()}</p>
                                <p style={{ fontWeight: 700, marginTop: '8px' }}>Total Amount: ₹{o.total_amount || o.totalAmount}</p>
                            </div>
                        ))}
                        {orders.length === 0 && <p style={{ textAlign: 'center', padding: '20px', color: '#999' }}>No orders yet.</p>}
                    </div>
                </div>

                {/* --- BOOKING HISTORY --- */}
                <div className="data-card">
                    <h3 style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px' }}><Calendar color="var(--primary)" /> Yard Bookings</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        {bookings.map(b => (
                            <div key={b._id} style={{ padding: '16px', border: '1px solid #F0F0F0', borderRadius: '12px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                    <span style={{ fontWeight: 800 }}>{new Date(b.booking_date || b.date).toLocaleDateString()}</span>
                                    <span style={{ fontSize: '0.75rem', padding: '4px 10px', background: (b.booking_status || b.status) === 'Approved' ? '#E8F5E9' : '#FFF3E0', color: (b.booking_status || b.status) === 'Approved' ? 'green' : 'orange', borderRadius: '100px' }}>{b.booking_status || b.status}</span>
                                </div>
                                <p style={{ fontSize: '0.85rem', color: '#666' }}>Slot: {b.time_slot || b.timeSlot} | Area: {b.areaSize} Acre</p>
                            </div>
                        ))}
                        {bookings.length === 0 && <p style={{ textAlign: 'center', padding: '20px', color: '#999' }}>No bookings yet.</p>}
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- ADMIN PAGES ---

const AdminLayout = ({ children }) => {
    const location = useLocation();
    const [isSidebarOpen, setSidebarOpen] = useState(window.innerWidth > 1024);
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 1024);

    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth <= 1024);
            if (window.innerWidth > 1024) setSidebarOpen(true);
            else setSidebarOpen(false);
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const menu = [
        { name: 'Dashboard', path: '/admin', icon: <BarChart3 size={20} /> },
        { name: 'Inventory', path: '/admin/inventory', icon: <Archive size={20} /> },
        { name: 'Orders', path: '/admin/orders', icon: <Truck size={20} /> },
        { name: 'Bookings', path: '/admin/bookings', icon: <Calendar size={20} /> },
        { name: 'Equipment', path: '/admin/equipment', icon: <Settings size={20} /> },
        { name: 'Reports', path: '/admin/reports', icon: <Download size={20} /> }
    ];

    return (
        <div className="admin-shell" style={{ display: 'flex', minHeight: '100vh', background: '#F8FAFC' }}>
            {/* Mobile Overlay */}
            {isMobile && isSidebarOpen && (
                <div
                    onClick={() => setSidebarOpen(false)}
                    style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 90 }}
                />
            )}

            <aside className="admin-sidebar" style={{
                background: '#111827',
                border: 'none',
                width: isSidebarOpen ? '280px' : '0',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                padding: isSidebarOpen ? '40px 24px' : '0',
                position: isMobile ? 'fixed' : 'relative',
                height: '100vh',
                zIndex: 100,
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column'
            }}>
                <div style={{ marginBottom: '40px', minWidth: '230px' }}>
                    <div style={{ color: 'var(--accent)', fontWeight: 900, fontSize: '1.2rem', borderLeft: '4px solid var(--accent)', paddingLeft: '16px', lineHeight: 1.2 }}>SHRI THIRUMURUGAN OIL MILL</div>
                    <p style={{ fontSize: '0.6rem', color: '#6B7280', marginTop: '6px', paddingLeft: '20px' }}>ADMINISTRATION SYSTEM</p>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1, minWidth: '230px' }}>
                    {menu.map(item => (
                        <Link
                            key={item.path}
                            to={item.path}
                            onClick={isMobile ? () => setSidebarOpen(false) : undefined}
                            className={`sidebar-link ${location.pathname === item.path ? 'active' : ''}`}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '12px',
                                padding: '12px 16px',
                                borderRadius: '12px',
                                textDecoration: 'none',
                                fontWeight: 600,
                                fontSize: '0.95rem',
                                color: location.pathname === item.path ? 'white' : '#9CA3AF',
                                background: location.pathname === item.path ? 'rgba(255,255,255,0.05)' : 'transparent'
                            }}
                        >
                            {item.icon} {item.name}
                        </Link>
                    ))}
                </div>

                <div style={{ marginTop: 'auto', borderTop: '1px solid #1F2937', paddingTop: '24px', minWidth: '230px' }}>
                    <Link to="/" className="sidebar-link" style={{ color: '#EF4444', display: 'flex', alignItems: 'center', gap: '12px', textDecoration: 'none', fontWeight: 600 }}>
                        <LogOut size={20} /> Exit Admin
                    </Link>
                </div>
            </aside>

            <main className="admin-main" style={{ flex: 1, padding: isMobile ? '24px' : '40px', maxWidth: '100%', overflowX: 'hidden' }}>
                <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        {isMobile && (
                            <button
                                onClick={() => setSidebarOpen(true)}
                                style={{ background: 'white', border: '1px solid #E2E8F0', padding: '10px', borderRadius: '12px', cursor: 'pointer' }}
                            >
                                <Menu size={20} />
                            </button>
                        )}
                        <h1 style={{ fontSize: isMobile ? '1.4rem' : '1.8rem', fontWeight: 800, margin: 0 }}>
                            {menu.find(m => m.path === location.pathname)?.name || 'Admin Panel'}
                        </h1>
                    </div>

                    <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                        {!isMobile && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'white', padding: '10px 16px', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
                                <Search size={18} color="#94A3B8" />
                                <input placeholder="Search..." style={{ border: 'none', outline: 'none', fontSize: '0.9rem' }} />
                            </div>
                        )}
                        <div style={{ width: '44px', height: '44px', borderRadius: '50%', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #E2E8F0' }}>
                            <UserIcon size={20} color="var(--primary)" />
                        </div>
                    </div>
                </header>

                <div className="content-container animate-fade-in">
                    {children}
                </div>
            </main>

            <style>{`
                .animate-fade-in {
                    animation: fadeIn 0.5s ease-out;
                }
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                @media (max-width: 768px) {
                    .dashboard-grid {
                        grid-template-columns: 1fr !important;
                    }
                    .data-card {
                        padding: 16px !important;
                    }
                }
            `}</style>
        </div>
    );
};

const AdminDashboard = () => {
    const [data, setData] = useState({ stats: {}, logs: [], chartData: [] });
    const [loading, setLoading] = useState(true);
    const { authorizedFetch } = useAuth();

    useEffect(() => {
        const fetchStats = async () => {
            const res = await authorizedFetch('http://localhost:5000/api/admin/stats');
            if (res.success && res.data) {
                setData(res.data);
            }
            setLoading(false);
        };
        fetchStats();
    }, []);

    const kpis = [
        { t: 'Net Revenue', v: `₹${data.stats.totalRevenue?.toLocaleString() || '0'}`, c: '+12.5%', i: <CreditCard />, color: '#10B981' },
        { t: 'Pending Orders', v: `${data.stats.pendingOrders || '0'} Units`, c: '+5 today', i: <Package />, color: '#F59E0B' },
        { t: 'Active Bookings', v: `${data.stats.activeBookings || '0'} Slots`, c: '82% Capacity', i: <Calendar />, color: '#3B82F6' },
        { t: 'Customers', v: (data.stats.totalCustomers || '0').toLocaleString(), c: '+18%', i: <UserIcon />, color: '#8B5CF6' }
    ];

    if (loading) return <div style={{ padding: '40px', textAlign: 'center' }}>Initializing Dashboard...</div>;

    const maxChartRevenue = Math.max(...data.chartData.map(d => d.revenue), 1000);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
            {/* --- KPI SECTION --- */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px' }}>
                {kpis.map(s => (
                    <div key={s.t} className="data-card" style={{ padding: '24px', border: '1px solid #F3F4F6' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                            <div style={{ background: `${s.color}15`, color: s.color, padding: '12px', borderRadius: '12px' }}>{s.i}</div>
                            <span style={{ fontSize: '0.75rem', fontWeight: 800, color: s.color }}>{s.c}</span>
                        </div>
                        <div>
                            <p style={{ fontSize: '0.85rem', color: '#6B7280', fontWeight: 600 }}>{s.t}</p>
                            <h2 style={{ fontSize: '1.6rem', fontWeight: 900, marginTop: '4px' }}>{s.v}</h2>
                        </div>
                    </div>
                ))}
            </div>

            <div className="dashboard-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '32px' }}>
                {/* --- CHART SECTION --- */}
                <div className="data-card" style={{ minHeight: '400px', display: 'flex', flexDirection: 'column', gridColumn: 'span 2' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px', flexWrap: 'wrap', gap: '16px' }}>
                        <div>
                            <h3 style={{ fontSize: '1.25rem' }}>Revenue Analytics</h3>
                            <p style={{ fontSize: '0.85rem', color: '#6B7280' }}>Daily mill earnings for the last 7 days</p>
                        </div>
                        <select style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid #E5E7EB', fontSize: '0.85rem' }}>
                            <option>Last 7 Days</option>
                        </select>
                    </div>
                    <div style={{ flex: 1, position: 'relative', display: 'flex', alignItems: 'flex-end', gap: '16px', padding: '20px 0' }}>
                        {[1, 2, 3, 4].map(l => <div key={l} style={{ position: 'absolute', left: 0, right: 0, bottom: `${l * 25}%`, borderTop: '1px dashed #F3F4F6', zIndex: 0 }} />)}

                        {data.chartData.map((d, i) => {
                            const h = (d.revenue / maxChartRevenue) * 100;
                            return (
                                <div key={i} style={{ flex: 1, position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 1 }}>
                                    <div style={{
                                        height: `${h || 5}%`,
                                        width: '100%',
                                        maxWidth: '40px',
                                        background: i === 6 ? 'var(--primary)' : 'linear-gradient(to top, var(--primary-glow), var(--primary))',
                                        borderRadius: '8px 8px 4px 4px',
                                        transition: 'height 1s cubic-bezier(0.4, 0, 0.2, 1)',
                                        cursor: 'pointer'
                                    }} title={`₹${d.revenue}`} />
                                    <span style={{ fontSize: '0.7rem', color: '#9CA3AF', marginTop: '12px', fontWeight: 700 }}>{d.day}</span>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* --- RECENT ACTIVITY --- */}
                <div className="data-card" style={{ gridColumn: 'span 1' }}>
                    <h3 style={{ fontSize: '1.25rem', marginBottom: '24px' }}>Recent Logs</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        {data.logs.map((log, i) => {
                            const config = log.type === 'ORDER' ?
                                { i: <ShoppingCart size={16} />, c: '#10B981' } :
                                { i: <Calendar size={16} />, c: '#3B82F6' };
                            return (
                                <div key={i} style={{ display: 'flex', gap: '12px' }}>
                                    <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: `${config.c}15`, color: config.c, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                        {config.i}
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <p style={{ fontSize: '0.85rem', fontWeight: 800 }}>{log.title}</p>
                                        <p style={{ fontSize: '0.8rem', color: '#666' }}>{log.desc}</p>
                                    </div>
                                    <span style={{ fontSize: '0.7rem', color: '#999' }}>
                                        {Math.floor((new Date() - new Date(log.time)) / 60000)}m ago
                                    </span>
                                </div>
                            );
                        })}
                        {data.logs.length === 0 && <p style={{ textAlign: 'center', color: '#999', padding: '20px' }}>No recent activity</p>}
                    </div>
                    <button className="btn btn-outline" style={{ width: '100%', marginTop: '32px', justifyContent: 'center', fontSize: '0.85rem', padding: '12px' }}>View Full AuditTrail</button>
                </div>
            </div>
        </div>
    );
};

const AdminReports = () => {
    const [data, setData] = useState({ stats: { totalRevenue: 0, monthRevenue: 0, inventoryHealth: { lowStock: 0, outOfStock: 0, totalItems: 0 } }, logs: [], chartData: [] });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { authorizedFetch } = useAuth();

    useEffect(() => {
        const fetchStats = async () => {
            console.log("AdminReports: Fetching stats...");
            try {
                const res = await authorizedFetch('http://localhost:5000/api/admin/stats');
                if (res.success && res.data) {
                    setData(res.data);
                } else {
                    setError(res.message || 'Failed to fetch report data');
                }
            } catch (err) {
                setError('System connection error');
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, []);

    if (loading) return <div style={{ padding: '40px', textAlign: 'center' }}>Generating Intelligence Reports...</div>;

    if (error) return (
        <div style={{ padding: '40px', textAlign: 'center' }}>
            <AlertCircle size={48} color="red" style={{ marginBottom: '16px' }} />
            <h3>Report Engine Error</h3>
            <p style={{ color: '#666' }}>{error}</p>
            <button onClick={() => window.location.reload()} className="btn btn-primary" style={{ marginTop: '20px' }}>Retry Connection</button>
        </div>
    );

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
            {/* Header with Export */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
                <div>
                    <h2 style={{ fontSize: '1.8rem', fontWeight: 800 }}>Mill Intelligence & Reports</h2>
                    <p style={{ color: '#666' }}>Deep dive into your business performance and historical data</p>
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                    <button className="btn btn-outline" style={{ padding: '10px 20px', fontSize: '0.85rem' }}><Download size={16} /> Export CSV</button>
                    <button className="btn btn-primary" style={{ padding: '10px 20px', fontSize: '0.85rem' }}>Print PDF</button>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '32px' }}>
                {/* Inventory Health Report */}
                <div className="data-card">
                    <h3 style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px' }}><Archive color="var(--primary)" /> Inventory Health</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '16px', background: '#F8FAFC', borderRadius: '12px' }}>
                            <span>Total Unique SKUs</span>
                            <span style={{ fontWeight: 800 }}>{data.stats.inventoryHealth?.totalItems || 0}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '16px', background: '#FFF7ED', borderRadius: '12px', color: '#C2410C' }}>
                            <span>Low Stock Alert (&lt;10)</span>
                            <span style={{ fontWeight: 800 }}>{data.stats.inventoryHealth?.lowStock || 0}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '16px', background: '#FEF2F2', borderRadius: '12px', color: '#B91C1C' }}>
                            <span>Out of Stock</span>
                            <span style={{ fontWeight: 800 }}>{data.stats.inventoryHealth?.outOfStock || 0}</span>
                        </div>
                    </div>
                </div>

                {/* Growth Metrics */}
                <div className="data-card">
                    <h3 style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px' }}><TrendingUp color="#10B981" /> Financial Performance</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        <div style={{ padding: '20px', border: '1px solid #F1F5F9', borderRadius: '16px' }}>
                            <p style={{ fontSize: '0.85rem', color: '#64748B' }}>Total Lifetime Revenue</p>
                            <h2 style={{ fontSize: '2rem', fontWeight: 900 }}>₹{(data.stats.totalRevenue || 0).toLocaleString()}</h2>
                        </div>
                        <div style={{ padding: '20px', border: '1px solid #F1F5F9', borderRadius: '16px' }}>
                            <p style={{ fontSize: '0.85rem', color: '#64748B' }}>Current Month Revenue</p>
                            <h2 style={{ fontSize: '2rem', fontWeight: 900, color: '#10B981' }}>₹{(data.stats.monthRevenue || 0).toLocaleString()}</h2>
                        </div>
                    </div>
                </div>
            </div>

            {/* Detailed Transaction Table (Placeholder for Report logic) */}
            <div className="data-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}>
                    <h3>Transaction Audit Log</h3>
                    <select className="input-field" style={{ width: 'auto', height: '40px', padding: '0 12px' }}>
                        <option>All Transactions</option>
                        <option>Successful Only</option>
                        <option>Failed Only</option>
                    </select>
                </div>
                <table className="standard-table">
                    <thead>
                        <tr>
                            <th>DateTime</th>
                            <th>Event Type</th>
                            <th>Details</th>
                            <th>Value</th>
                        </tr>
                    </thead>
                    <tbody>
                        {data.logs?.map((log, i) => (
                            <tr key={i}>
                                <td style={{ fontSize: '0.85rem', color: '#666' }}>{new Date(log.time).toLocaleString()}</td>
                                <td><span style={{ padding: '4px 10px', background: '#F1F5F9', borderRadius: '100px', fontSize: '0.75rem', fontWeight: 700 }}>{log.type}</span></td>
                                <td style={{ fontWeight: 600 }}>{log.desc}</td>
                                <td style={log.type === 'ORDER' ? { color: '#10B981', fontWeight: 800 } : {}}>{log.type === 'ORDER' ? 'Credit' : 'System'}</td>
                            </tr>
                        ))}
                        {(!data.logs || data.logs.length === 0) && (
                            <tr><td colSpan="4" style={{ textAlign: 'center', padding: '20px', color: '#999' }}>No transaction records found</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

const AdminInventory = () => {
    const [products, setProducts] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [editStock, setEditStock] = useState({}); // { [productId]: newStockValue }
    const [newProduct, setNewProduct] = useState({ product_name: '', category: '', description: '', price: '', stock_quantity: '', image_url: '', sizes: '', benefits: '' });
    const [imageFile, setImageFile] = useState(null);
    const [saving, setSaving] = useState(false);
    const { authorizedFetch } = useAuth();

    const fetchProducts = async () => {
        const res = await fetch('http://localhost:5000/api/products');
        const data = await res.json();
        if (res.ok) setProducts(data);
    };

    useEffect(() => { fetchProducts(); }, []);

    const handleAddProduct = async (e) => {
        e.preventDefault();
        setSaving(true);

        let finalImageUrl = newProduct.image_url;
        if (imageFile) {
            try {
                const storageRef = ref(storage, `products/${Date.now()}_${imageFile.name}`);
                const snapshot = await uploadBytes(storageRef, imageFile);
                finalImageUrl = await getDownloadURL(snapshot.ref);
            } catch (error) {
                console.error("Firebase upload error:", error);
                alert("Failed to upload image. Please check your Firebase configuration.");
                setSaving(false);
                return;
            }
        }

        const payload = {
            ...newProduct,
            image_url: finalImageUrl,
            price: Number(newProduct.price),
            stock_quantity: Number(newProduct.stock_quantity),
            sizes: newProduct.sizes.split(',').map(s => s.trim()).filter(Boolean),
            benefits: newProduct.benefits.split(',').map(b => b.trim()).filter(Boolean),
            itemType: 'sale'
        };
        const res = await authorizedFetch('http://localhost:5000/api/products', { method: 'POST', body: JSON.stringify(payload) });
        setSaving(false);
        if (res.success) {
            alert('Product added successfully!');
            setShowModal(false);
            setNewProduct({ product_name: '', category: '', description: '', price: '', stock_quantity: '', image_url: '', sizes: '', benefits: '' });
            setImageFile(null);
            fetchProducts();
        } else {
            alert('Error: ' + res.message);
        }
    };

    const handleUpdateStock = async (productId, newStock) => {
        const res = await authorizedFetch(`http://localhost:5000/api/products/${productId}/stock`, {
            method: 'PATCH',
            body: JSON.stringify({ stock_quantity: Number(newStock) })
        });
        if (res.success) {
            alert('Stock updated!');
            fetchProducts();
        } else {
            alert('Error: ' + res.message);
        }
    };

    const inputStyle = { width: '100%', padding: '10px 14px', border: '1px solid #E0E0E0', borderRadius: '8px', fontSize: '0.9rem', marginBottom: '12px', boxSizing: 'border-box' };

    return (
        <div>
            {/* ADD PRODUCT MODAL */}
            {showModal && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
                    <div style={{ background: 'white', borderRadius: '20px', padding: '40px', width: '100%', maxWidth: '560px', maxHeight: '90vh', overflowY: 'auto' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                            <h3 style={{ fontSize: '1.4rem' }}>Add New Product</h3>
                            <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.4rem' }}>✕</button>
                        </div>
                        <form onSubmit={handleAddProduct}>
                            <label style={{ fontSize: '0.8rem', fontWeight: 700 }}>Product Name *</label>
                            <input style={inputStyle} placeholder="e.g. Cold Pressed Coconut Oil" value={newProduct.product_name} onChange={e => setNewProduct({ ...newProduct, product_name: e.target.value })} required />
                            <label style={{ fontSize: '0.8rem', fontWeight: 700 }}>Category *</label>
                            <input style={inputStyle} placeholder="e.g. Coconut Oils" value={newProduct.category} onChange={e => setNewProduct({ ...newProduct, category: e.target.value })} required />
                            <label style={{ fontSize: '0.8rem', fontWeight: 700 }}>Description</label>
                            <textarea style={{ ...inputStyle, height: '80px', resize: 'vertical' }} placeholder="Short product description..." value={newProduct.description} onChange={e => setNewProduct({ ...newProduct, description: e.target.value })} />
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                <div>
                                    <label style={{ fontSize: '0.8rem', fontWeight: 700 }}>Price (₹) *</label>
                                    <input style={inputStyle} type="number" placeholder="e.g. 350" value={newProduct.price} onChange={e => setNewProduct({ ...newProduct, price: e.target.value })} required />
                                </div>
                                <div>
                                    <label style={{ fontSize: '0.8rem', fontWeight: 700 }}>Stock Quantity *</label>
                                    <input style={inputStyle} type="number" placeholder="e.g. 50" value={newProduct.stock_quantity} onChange={e => setNewProduct({ ...newProduct, stock_quantity: e.target.value })} required />
                                </div>
                            </div>
                            <label style={{ fontSize: '0.8rem', fontWeight: 700 }}>Image (Upload or URL)</label>
                            <div style={{ display: 'flex', gap: '12px', marginBottom: '12px' }}>
                                <input type="file" style={{ flex: 1, padding: '8px', border: '1px solid #E0E0E0', borderRadius: '8px', fontSize: '0.85rem' }} onChange={e => setImageFile(e.target.files[0])} accept="image/*" />
                                <span style={{ padding: '8px', fontSize: '0.8rem', color: '#666', display: 'flex', alignItems: 'center' }}>OR</span>
                                <input style={{ ...inputStyle, marginBottom: 0, flex: 1 }} placeholder="Image URL (e.g. /img2.jpg)" value={newProduct.image_url} onChange={e => setNewProduct({ ...newProduct, image_url: e.target.value })} disabled={!!imageFile} />
                            </div>
                            <label style={{ fontSize: '0.8rem', fontWeight: 700 }}>Sizes (comma separated)</label>
                            <input style={inputStyle} placeholder="250ml, 500ml, 1L" value={newProduct.sizes} onChange={e => setNewProduct({ ...newProduct, sizes: e.target.value })} />
                            <label style={{ fontSize: '0.8rem', fontWeight: 700 }}>Benefits (comma separated)</label>
                            <input style={inputStyle} placeholder="Pure, Organic, Cold Pressed" value={newProduct.benefits} onChange={e => setNewProduct({ ...newProduct, benefits: e.target.value })} />
                            <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '14px', justifyContent: 'center', marginTop: '8px' }} disabled={saving}>
                                {saving ? 'Saving...' : 'Add Product to Store'}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            <div className="data-card" style={{ overflowX: 'auto' }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: '32px', gap: '16px' }}>
                    <h3>Product Inventory — {products.length} Items</h3>
                    <button className="btn btn-primary" style={{ padding: '8px 20px', fontSize: '0.85rem' }} onClick={() => setShowModal(true)}><Plus size={16} /> Add Product</button>
                </div>
                <table className="standard-table" style={{ minWidth: '700px' }}>
                    <thead><tr><th>ID</th><th>Product</th><th>Category</th><th>Stock</th><th>Price</th><th>Update Stock</th></tr></thead>
                    <tbody>
                        {products.map(p => (
                            <tr key={p._id}>
                                <td style={{ fontSize: '0.75rem', color: '#999' }}>#{p._id?.slice(-5).toUpperCase()}</td>
                                <td style={{ fontWeight: 700 }}>{p.product_name}</td>
                                <td style={{ fontSize: '0.8rem', color: '#666' }}>{p.category}</td>
                                <td style={{ color: p.stock_quantity < 15 ? 'red' : 'green', fontWeight: 700 }}>{p.stock_quantity} units</td>
                                <td>₹{p.price}</td>
                                <td>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <input
                                            type="number"
                                            defaultValue={p.stock_quantity}
                                            onChange={e => setEditStock({ ...editStock, [p._id]: e.target.value })}
                                            style={{ width: '70px', padding: '6px 8px', border: '1px solid #DDD', borderRadius: '6px', fontSize: '0.85rem' }}
                                        />
                                        <button
                                            onClick={() => handleUpdateStock(p._id, editStock[p._id] ?? p.stock_quantity)}
                                            style={{ padding: '6px 12px', background: 'var(--primary)', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 700 }}
                                        >Save</button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {products.length === 0 && <p style={{ textAlign: 'center', padding: '40px', color: '#999' }}>No products in database. Add your first product above.</p>}
            </div>
        </div>
    );
};

const AdminOrders = () => {
    const [orders, setOrders] = useState([]);
    const { authorizedFetch } = useAuth();

    useEffect(() => {
        const fetchOrders = async () => {
            const res = await authorizedFetch('http://localhost:5000/api/orders/all');
            if (res.success) setOrders(res.data);
        };
        fetchOrders();
    }, []);

    const updateStatus = async (id, status) => {
        await authorizedFetch(`http://localhost:5000/api/orders/${id}/status`, {
            method: 'PATCH',
            body: JSON.stringify({ order_status: status })
        });
        // Refresh orders
        const res = await authorizedFetch('http://localhost:5000/api/orders/all');
        if (res.success) setOrders(res.data);
    };

    return (
        <div className="data-card">
            <h3>Client Orders Pipeline</h3>
            <table className="standard-table">
                <thead><tr><th>Order Id</th><th>Customer</th><th>Amount</th><th>Status</th><th>Tracing</th></tr></thead>
                <tbody>
                    {orders.map(o => (
                        <tr key={o._id}>
                            <td>#{o._id.slice(-6).toUpperCase()}</td>
                            <td>{o.user?.name || 'Guest'}</td>
                            <td>₹{o.total_amount || o.totalAmount}</td>
                            <td><span style={{ padding: '4px 12px', background: (o.order_status || o.orderStatus) === 'Delivered' ? '#E8F5E9' : '#FFF3E0', color: (o.order_status || o.orderStatus) === 'Delivered' ? '#2E7D32' : '#F57C00', borderRadius: '100px', fontSize: '0.75rem', fontWeight: 800 }}>{o.order_status || o.orderStatus}</span></td>
                            <td><Link to="#" style={{ color: 'var(--primary)' }} onClick={() => updateStatus(o._id, 'Delivered')}><CheckCircle size={16} /></Link></td>
                        </tr>
                    ))}
                    {orders.length === 0 && <tr><td colSpan="5" style={{ textAlign: 'center', padding: '40px', color: '#999' }}>No orders found in database</td></tr>}
                </tbody>
            </table>
        </div>
    );
};

const AdminBookings = () => {
    const [bookings, setBookings] = useState([]);
    const { authorizedFetch } = useAuth();

    useEffect(() => {
        const fetchBookings = async () => {
            const res = await authorizedFetch('http://localhost:5000/api/bookings/all');
            if (res.success) setBookings(res.data);
        };
        fetchBookings();
    }, []);

    const handleAction = async (id, status) => {
        const res = await authorizedFetch(`http://localhost:5000/api/bookings/${id}/status`, {
            method: 'PATCH',
            body: JSON.stringify({ booking_status: status })
        });
        if (res.success) {
            setBookings(bookings.map(b => b._id === id ? { ...b, booking_status: status } : b));
        }
    };

    return (
        <div className="data-card">
            <h3>Yard Reservation System</h3>
            <div style={{ marginTop: '24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {bookings.map((b, i) => (
                    <div key={b._id} style={{ padding: '20px', border: '1px solid #EEE', borderRadius: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                            <p style={{ fontWeight: 800, fontSize: '1.1rem' }}>{b.user?.name || 'Customer'}</p>
                            <p style={{ color: '#666' }}>{new Date(b.booking_date || b.date).toLocaleDateString()} | {b.time_slot || b.timeSlot} | {b.yardName || 'Legacy Yard'} ({b.areaSize} Acre)</p>
                            <p style={{ fontSize: '0.8rem', color: (b.booking_status || b.status) === 'Approved' ? 'green' : ((b.booking_status || b.status) === 'Rejected' ? 'red' : 'orange'), fontWeight: 700 }}>Status: {b.booking_status || b.status}</p>
                        </div>
                        <div style={{ display: 'flex', gap: '12px' }}>
                            {(b.booking_status || b.status) === 'Pending' && (
                                <>
                                    <button onClick={() => handleAction(b._id, 'Rejected')} className="btn btn-outline" style={{ padding: '8px 16px', borderColor: 'red', color: 'red' }}>Reject</button>
                                    <button onClick={() => handleAction(b._id, 'Approved')} className="btn btn-primary" style={{ padding: '8px 16px' }}>Approve</button>
                                </>
                            )}
                        </div>
                    </div>
                ))}
                {bookings.length === 0 && <p style={{ textAlign: 'center', padding: '40px', color: '#999' }}>No reservations found</p>}
            </div>
        </div>
    );
};

const AdminEquipment = () => {
    const [fleet, setFleet] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [newAsset, setNewAsset] = useState({ product_name: '', category: 'Tools', price: '', rentalPeriod: 'Day', status: 'Available' });
    const [saving, setSaving] = useState(false);
    const { authorizedFetch } = useAuth();

    const fetchFleet = async () => {
        try {
            const res = await fetch('http://localhost:5000/api/products');
            const data = await res.json();
            if (res.ok) {
                const rentalItems = data.filter(item => item.itemType === 'rental');
                setFleet(rentalItems);
            }
        } catch (e) { console.error('Failed to fetch fleet'); }
    };

    useEffect(() => {
        fetchFleet();
    }, []);

    const handleCreate = async (e) => {
        e.preventDefault();
        setSaving(true);
        const res = await authorizedFetch('http://localhost:5000/api/products', {
            method: 'POST',
            body: JSON.stringify({ ...newAsset, itemType: 'rental', stock_quantity: 1 })
        });
        setSaving(false);
        if (res.success) {
            alert('New Asset Registered!');
            setShowModal(false);
            setNewAsset({ product_name: '', category: 'Tools', price: '', rentalPeriod: 'Day', status: 'Available' });
            fetchFleet();
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to decommission this asset?')) return;
        const res = await authorizedFetch(`http://localhost:5000/api/products/${id}`, { method: 'DELETE' });
        if (res.success) {
            alert('Asset Deleted');
            fetchFleet();
        }
    };

    const toggleStatus = async (item) => {
        const newStatus = item.status === 'Available' ? 'In Use' : 'Available';
        const res = await authorizedFetch(`http://localhost:5000/api/products/${item._id}`, {
            method: 'PUT',
            body: JSON.stringify({ ...item, status: newStatus })
        });
        if (res.success) fetchFleet();
    };

    return (
        <div className="data-card">
            {showModal && (
                <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                    <div className="glass-card" style={{ width: '100%', maxWidth: '450px', background: 'white' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}>
                            <h3 style={{ margin: 0 }}>Register New Asset</h3>
                            <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><XCircle size={20} /></button>
                        </div>
                        <form onSubmit={handleCreate}>
                            <input className="input-field" placeholder="Machinery Name" value={newAsset.product_name} onChange={e => setNewAsset({ ...newAsset, product_name: e.target.value })} required />
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                <input className="input-field" type="number" placeholder="Rent Price" value={newAsset.price} onChange={e => setNewAsset({ ...newAsset, price: e.target.value })} required />
                                <select className="input-field" value={newAsset.rentalPeriod} onChange={e => setNewAsset({ ...newAsset, rentalPeriod: e.target.value })}>
                                    <option value="Day">Per Day</option>
                                    <option value="Hour">Per Hour</option>
                                    <option value="Month">Per Month</option>
                                </select>
                            </div>
                            <select className="input-field" value={newAsset.category} onChange={e => setNewAsset({ ...newAsset, category: e.target.value })}>
                                <option value="Tools">Manual Tools</option>
                                <option value="Processing">Processing Machine</option>
                                <option value="Drying">Drying Equipment</option>
                            </select>
                            <button className="btn btn-primary" style={{ width: '100%', padding: '14px', justifyContent: 'center' }} disabled={saving}>
                                {saving ? 'Registering...' : 'Add to Fleet'}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '32px' }}>
                <h3>Fleet Management — {fleet.length} Assets</h3>
                <button className="btn btn-primary" onClick={() => setShowModal(true)} style={{ padding: '8px 16px', fontSize: '0.8rem' }}><Plus size={16} /> Register Asset</button>
            </div>
            <div style={{ overflowX: 'auto' }}>
                <table className="standard-table">
                    <thead><tr><th>Asset Code</th><th>Machinery</th><th>Rate</th><th>Status</th><th>Actions</th></tr></thead>
                    <tbody>
                        {fleet.map(r => (
                            <tr key={r._id}>
                                <td>#EQ-{r._id?.slice(-4).toUpperCase()}</td>
                                <td style={{ fontWeight: 700 }}>{r.product_name || r.name}</td>
                                <td>₹{r.price}/{r.rentalPeriod || r.type}</td>
                                <td>
                                    <button
                                        onClick={() => toggleStatus(r)}
                                        style={{
                                            background: (r.status || 'Available') === 'Available' ? '#E8F5E9' : '#FFF3E0',
                                            color: (r.status || 'Available') === 'Available' ? '#2E7D32' : '#F57C00',
                                            border: 'none', padding: '4px 12px', borderRadius: '100px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 800
                                        }}
                                    >
                                        {r.status || 'Available'}
                                    </button>
                                </td>
                                <td style={{ display: 'flex', gap: '8px' }}>
                                    <button onClick={() => handleDelete(r._id)} style={{ color: 'red', background: 'none', border: 'none', cursor: 'pointer' }}><Trash2 size={16} /></button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {fleet.length === 0 && <p style={{ textAlign: 'center', padding: '40px', color: '#999' }}>Fleet registry is empty. Register your first asset above.</p>}
            </div>
        </div>
    );
};

// --- AI CHATBOT MODULE ---
const AIChatbot = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([{ role: 'ai', text: 'Namaskaram! How can I assist you with Shri Thirumurugan Oil Mill products today?' }]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSend = async () => {
        if (!input.trim()) return;
        const userText = input;
        setMessages(prev => [...prev, { role: 'user', text: userText }]);
        setInput('');
        setLoading(true);

        try {
            // Free API interaction mocking (or real integration if keys exist)
            // Replace with Google Gemini API call later if needed
            setTimeout(() => {
                const aiResponse = userText.toLowerCase().includes('oil')
                    ? "Our cold-pressed coconut oils are 100% natural and extracted using traditional wood-pressing (Mara Chekku) methods. We have both sulphur and sulphur-free options!"
                    : "That's an excellent question! I'm your Free AI Assistant. I can help you find products, check equipment rentals, or book drying yards.";
                setMessages(prev => [...prev, { role: 'ai', text: aiResponse }]);
                setLoading(false);
            }, 1000);
        } catch (e) {
            setLoading(false);
        }
    };

    return (
        <div style={{ position: 'fixed', bottom: '24px', right: '24px', zIndex: 9999 }}>
            {!isOpen ? (
                <button onClick={() => setIsOpen(true)} className="btn btn-primary shimmer" style={{ borderRadius: '50%', width: '60px', height: '60px', padding: 0, justifyContent: 'center', boxShadow: '0 8px 24px rgba(46,125,50,0.3)' }}>
                    <MessageCircle size={28} />
                </button>
            ) : (
                <div className="glass-card" style={{ width: '350px', height: '500px', display: 'flex', flexDirection: 'column', padding: 0, overflow: 'hidden', boxShadow: '0 12px 32px rgba(0,0,0,0.15)', border: '1px solid #E0E0E0' }}>
                    <div style={{ background: 'var(--primary)', color: 'white', padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700 }}><MessageCircle size={20} /> AI Assistant</div>
                        <button onClick={() => setIsOpen(false)} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}><XCircle size={20} /></button>
                    </div>
                    <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px', background: '#FAFAFA' }}>
                        {messages.map((m, i) => (
                            <div key={i} style={{ alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start', background: m.role === 'user' ? '#E8F5E9' : 'white', padding: '10px 14px', borderRadius: '12px', maxWidth: '85%', border: '1px solid #F0F0F0', fontSize: '0.9rem', lineHeight: 1.4, color: m.role === 'user' ? '#2E7D32' : '#333' }}>
                                {m.text}
                            </div>
                        ))}
                        {loading && <div style={{ fontSize: '0.8rem', color: '#999', paddingLeft: '8px' }}>AI is thinking...</div>}
                    </div>
                    <div style={{ padding: '12px', background: 'white', borderTop: '1px solid #EEE', display: 'flex', gap: '8px' }}>
                        <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSend()} placeholder="Ask something..." className="input-field" style={{ flex: 1, padding: '10px 14px', borderRadius: '100px', fontSize: '0.9rem' }} />
                        <button onClick={handleSend} className="btn btn-primary" style={{ padding: '10px 20px', borderRadius: '100px' }}>Send</button>
                    </div>
                </div>
            )}
        </div>
    );
};

// --- RAZORPAY MOCK SIMULATOR ---
const RazorpayMock = ({ amount, onPaymentSuccess, onCancel }) => {
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);

    const handlePay = () => {
        setLoading(true);
        setTimeout(() => {
            setLoading(false);
            setStep(2);
            setTimeout(() => {
                onPaymentSuccess({
                    razorpay_payment_id: `pay_mock_${Date.now()}`,
                    razorpay_order_id: `order_mock_${Date.now()}`,
                    razorpay_signature: `sig_mock_${Date.now()}`
                });
            }, 1500);
        }, 1500);
    };

    return (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000 }}>
            <div className="glass-card animate-scale-up" style={{ width: '400px', padding: 0, overflow: 'hidden', background: 'white' }}>
                <div style={{ background: '#2E3137', color: 'white', padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ width: '32px', height: '32px', background: '#4CAF50', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900 }}>T</div>
                        <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>Shri Thirumurugan Oil Mill</span>
                    </div>
                    <button onClick={onCancel} style={{ background: 'none', border: 'none', color: '#999', cursor: 'pointer' }}><XCircle size={20} /></button>
                </div>

                {step === 1 ? (
                    <div style={{ padding: '32px' }}>
                        <p style={{ color: '#666', fontSize: '0.8rem', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '1px' }}>Total Amount</p>
                        <h2 style={{ fontSize: '2rem', marginBottom: '32px' }}>₹{amount}.00</h2>

                        <div style={{ background: '#F5F7F9', padding: '16px', borderRadius: '8px', marginBottom: '24px' }}>
                            <p style={{ fontSize: '0.85rem', fontWeight: 600, color: '#444' }}>Payment Method</p>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '12px', padding: '12px', border: '1px solid #4CAF50', borderRadius: '6px', background: 'rgba(76, 175, 80, 0.05)' }}>
                                <CreditCard size={20} color="#4CAF50" />
                                <span style={{ fontSize: '0.9rem', color: '#2E7D32', fontWeight: 600 }}>Mock Testing Card</span>
                            </div>
                        </div>

                        <button
                            className="btn btn-primary"
                            onClick={handlePay}
                            disabled={loading}
                            style={{ width: '100%', padding: '16px', justifyContent: 'center', background: '#3392FF', borderColor: '#3392FF', color: 'white' }}
                        >
                            {loading ? "Processing..." : `Pay ₹${amount}`}
                        </button>
                        <p style={{ textAlign: 'center', fontSize: '0.7rem', color: '#999', marginTop: '16px' }}>Secure Payment by Razorpay Simulator</p>
                    </div>
                ) : (
                    <div style={{ padding: '60px 32px', textAlign: 'center' }}>
                        <div className="animate-bounce" style={{ width: '80px', height: '80px', background: '#E8F5E9', color: '#4CAF50', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
                            <Check size={48} strokeWidth={3} />
                        </div>
                        <h3 style={{ color: '#2E7D32' }}>Payment Successful!</h3>
                        <p style={{ color: '#666', marginTop: '8px' }}>Your transaction has been processed.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

// --- APP ROOT ---

const Login = () => {
    const [form, setForm] = useState({ e: '', p: '' });
    const { login, googleLogin } = useAuth();
    const navigate = useNavigate();
    const [error, setError] = useState('');

    const handle = async (e) => {
        e.preventDefault();
        const res = await login(form.e, form.p);
        if (res.success) {
            const savedUser = JSON.parse(localStorage.getItem('user'));
            if (savedUser.role === 'USER') navigate('/');
            else { navigate('/login'); setError('This portal is for customers only.'); }
        } else {
            setError(res.message);
        }
    };

    const handleGoogleLogin = async () => {
        const res = await googleLogin();
        if (res.success) {
            const savedUser = JSON.parse(localStorage.getItem('user'));
            if (savedUser?.role === 'USER') navigate('/');
            else { navigate('/login'); setError('This portal is for customers only.'); }
        } else {
            setError(res.message);
        }
    };

    return (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F9FBF9', padding: '20px' }}>
            <div className="login-card" style={{ width: '100%', maxWidth: '400px' }}>
                <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                    <div style={{ color: 'var(--primary)', fontWeight: 900, fontSize: '1.2rem', marginBottom: '8px' }}>USER PORTAL</div>
                    <h2 style={{ fontSize: '1.8rem' }}>Welcome Back</h2>
                </div>

                {error && <div style={{ background: '#FEE2E2', color: '#B91C1C', padding: '12px', borderRadius: '8px', marginBottom: '20px', fontSize: '0.9rem', textAlign: 'center' }}>{error}</div>}

                <form onSubmit={handle}>
                    <div style={{ marginBottom: '16px' }}>
                        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '8px' }}>Email Address</label>
                        <input className="input-field" placeholder="your@email.com" type="email" onChange={e => setForm({ ...form, e: e.target.value })} required />
                    </div>
                    <div style={{ marginBottom: '24px' }}>
                        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '8px' }}>Password</label>
                        <input className="input-field" type="password" placeholder="••••••••" onChange={e => setForm({ ...form, p: e.target.value })} required />
                    </div>

                    <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '16px', borderRadius: '12px', fontWeight: 700 }}>Sign In</button>
                </form>

                <div style={{ margin: '24px 0', textAlign: 'center', position: 'relative' }}>
                    <hr style={{ opacity: 0.1 }} />
                    <span style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', background: 'white', padding: '0 12px', color: '#999', fontSize: '0.8rem' }}>OR</span>
                </div>

                <button onClick={handleGoogleLogin} className="btn btn-outline" style={{ width: '100%', justifyContent: 'center', padding: '12px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '10px', fontWeight: 600 }}>
                    <img src="https://www.gstatic.com/images/branding/product/1x/gsa_512dp.png" alt="Google" style={{ width: '20px' }} />
                    Sign in with Google
                </button>

                <p style={{ textAlign: 'center', marginTop: '32px', fontSize: '0.9rem', color: '#666' }}>
                    Don't have an account? <Link to="/signup" style={{ color: 'var(--primary)', fontWeight: 700, textDecoration: 'none' }}>Create Account</Link>
                </p>
                <Link to="/admin-login" style={{ display: 'block', textAlign: 'center', marginTop: '20px', fontSize: '0.75rem', color: '#AAA', textDecoration: 'none' }}>Admin Access Only</Link>
            </div>
        </div>
    );
};

const AdminLogin = () => {
    const [form, setForm] = useState({ e: '', p: '' });
    const { login } = useAuth();
    const navigate = useNavigate();
    const [error, setError] = useState('');

    const handle = async (e) => {
        e.preventDefault();
        const res = await login(form.e, form.p);
        if (res.success) {
            const savedUser = JSON.parse(localStorage.getItem('user'));
            if (savedUser.role === 'ADMIN') navigate('/admin');
            else { navigate('/admin-login'); setError('Access denied. Admins only.'); }
        } else {
            setError(res.message);
        }
    };

    return (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#111827', padding: '20px' }}>
            <div className="login-card" style={{ width: '100%', maxWidth: '400px', background: '#1F2937', color: 'white', border: '1px solid #374151' }}>
                <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                    <div style={{ color: 'var(--accent)', fontWeight: 900, fontSize: '1.2rem', marginBottom: '8px' }}>SHRI THIRUMURUGAN OIL MILL</div>
                    <h2 style={{ fontSize: '1.8rem' }}>Admin Control Center</h2>
                </div>

                {error && <div style={{ background: '#7F1D1D', color: '#F87171', padding: '12px', borderRadius: '8px', marginBottom: '20px', fontSize: '0.9rem', textAlign: 'center' }}>{error}</div>}

                <form onSubmit={handle}>
                    <div style={{ marginBottom: '16px' }}>
                        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '8px', color: '#9CA3AF' }}>Admin Email</label>
                        <input className="input-field" placeholder="admin@mill.com" type="email" onChange={e => setForm({ ...form, e: e.target.value })} required style={{ background: '#374151', border: '1px solid #4B5563', color: 'white' }} />
                    </div>
                    <div style={{ marginBottom: '24px' }}>
                        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '8px', color: '#9CA3AF' }}>Secure Key</label>
                        <input className="input-field" type="password" placeholder="••••••••" onChange={e => setForm({ ...form, p: e.target.value })} required style={{ background: '#374151', border: '1px solid #4B5563', color: 'white' }} />
                    </div>

                    <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '16px', borderRadius: '12px', fontWeight: 700, background: 'var(--accent)', color: '#000' }}>Initialize Station</button>
                </form>

                <Link to="/login" style={{ display: 'block', textAlign: 'center', marginTop: '32px', fontSize: '0.85rem', color: '#9CA3AF', textDecoration: 'none' }}>Return to User Site</Link>
            </div>
        </div>
    );
};

const Signup = () => {
    const [form, setForm] = useState({ name: '', email: '', phone_number: '', address: '', password: '', role: 'USER' });
    const { signup, googleLogin } = useAuth();
    const navigate = useNavigate();
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handle = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        const res = await signup(form);
        setLoading(false);
        if (res.success) {
            alert('Registration successful! Please login.');
            navigate('/login');
        } else {
            setError(res.message);
        }
    };

    return (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F9FBF9', padding: '40px 20px' }}>
            <div className="login-card" style={{ width: '100%', maxWidth: '500px' }}>
                <h2 style={{ textAlign: 'center', marginBottom: '8px' }}>Create Account</h2>
                <p style={{ textAlign: 'center', color: '#666', marginBottom: '32px' }}>Join the traditional oil mill community</p>

                {error && <div style={{ background: '#FEE2E2', color: '#B91C1C', padding: '12px', borderRadius: '8px', marginBottom: '20px', fontSize: '0.9rem', textAlign: 'center' }}>{error}</div>}

                <form onSubmit={handle}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '8px' }}>Full Name</label>
                            <input className="input-field" placeholder="John Doe" onChange={e => setForm({ ...form, name: e.target.value })} required />
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '8px' }}>Phone Number</label>
                            <input className="input-field" placeholder="+91 9876543210" onChange={e => setForm({ ...form, phone_number: e.target.value })} required />
                        </div>
                    </div>
                    <div style={{ marginBottom: '16px' }}>
                        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '8px' }}>Address</label>
                        <input className="input-field" placeholder="123 Mill St, Tiruppur" onChange={e => setForm({ ...form, address: e.target.value })} required />
                    </div>

                    <div style={{ marginBottom: '16px' }}>
                        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '8px' }}>Email Address</label>
                        <input className="input-field" type="email" placeholder="john@example.com" onChange={e => setForm({ ...form, email: e.target.value })} required />
                    </div>


                    <div style={{ marginBottom: '32px', display: 'none' }}>
                        <input value="customer" readOnly />
                    </div>

                    <div style={{ marginBottom: '32px' }}>
                        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '8px' }}>Password</label>
                        <input className="input-field" type="password" placeholder="••••••••" onChange={e => setForm({ ...form, password: e.target.value })} required />
                    </div>

                    <button className="btn btn-primary" disabled={loading} style={{ width: '100%', justifyContent: 'center', padding: '16px', borderRadius: '12px', fontWeight: 700 }}>
                        {loading ? 'Creating Account...' : 'Register Now'}
                    </button>
                </form>

                <div style={{ margin: '24px 0', textAlign: 'center', position: 'relative' }}>
                    <hr style={{ opacity: 0.1 }} />
                    <span style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', background: '#F9FBF9', padding: '0 12px', color: '#999', fontSize: '0.8rem' }}>OR</span>
                </div>

                <button type="button" onClick={async () => {
                    setLoading(true);
                    const res = await googleLogin();
                    setLoading(false);
                    if (res.success) {
                        alert('Registration successful!');
                        navigate('/');
                    } else {
                        setError(res.message);
                    }
                }} className="btn btn-outline" style={{ width: '100%', justifyContent: 'center', padding: '12px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '10px', fontWeight: 600 }}>
                    <img src="https://www.gstatic.com/images/branding/product/1x/gsa_512dp.png" alt="Google" style={{ width: '20px' }} />
                    Sign up with Google
                </button>

                <p style={{ textAlign: 'center', marginTop: '32px', fontSize: '0.9rem', color: '#666' }}>
                    Already have an account? <Link to="/login" style={{ color: 'var(--primary)', fontWeight: 700, textDecoration: 'none' }}>Sign In</Link>
                </p>
            </div>
        </div>
    );
};

const AdminSignup = () => {
    const [form, setForm] = useState({ name: '', email: '', phone_number: '', address: '', password: '', role: 'ADMIN', secret: '' });
    const { signup } = useAuth();
    const navigate = useNavigate();
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const SECRET_KEY = "MILL_CORE_2024"; // The secret phrase needed to create an admin

    const handle = async (e) => {
        e.preventDefault();
        if (form.secret !== SECRET_KEY) {
            setError('Invalid Administrator Security Phrase');
            return;
        }
        setLoading(true);
        const res = await signup(form);
        setLoading(false);
        if (res.success) {
            alert('Admin Station Initialized Successfully!');
            navigate('/admin-login');
        } else {
            setError(res.message);
        }
    };

    return (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0F172A', padding: '40px 20px' }}>
            <div className="login-card" style={{ width: '100%', maxWidth: '500px', background: '#1E293B', color: 'white', border: '1px solid #334155' }}>
                <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                    <Settings size={40} color="var(--accent)" style={{ marginBottom: '16px' }} />
                    <h2 style={{ fontSize: '1.8rem', color: 'white' }}>SHRI THIRUMURUGAN</h2>
                    <p style={{ color: '#94A3B8' }}>Restricted Access Admin Setup</p>
                </div>

                {error && <div style={{ background: '#7F1D1D', color: '#FCA5A5', padding: '12px', borderRadius: '8px', marginBottom: '20px', fontSize: '0.9rem', textAlign: 'center' }}>{error}</div>}

                <form onSubmit={handle}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '8px', color: '#94A3B8' }}>Admin Name</label>
                            <input className="input-field" placeholder="Admin User" onChange={e => setForm({ ...form, name: e.target.value })} required style={{ background: '#334155', border: 'none', color: 'white' }} />
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '8px', color: '#94A3B8' }}>Email</label>
                            <input className="input-field" type="email" placeholder="admin@mill.com" onChange={e => setForm({ ...form, email: e.target.value })} required style={{ background: '#334155', border: 'none', color: 'white' }} />
                        </div>
                    </div>

                    <div style={{ marginBottom: '16px' }}>
                        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '8px', color: '#94A3B8' }}>Master Security Phrase</label>
                        <input className="input-field" type="password" placeholder="Enter System Secret" onChange={e => setForm({ ...form, secret: e.target.value })} required style={{ background: '#334155', border: '1px solid var(--accent)', color: 'white' }} />
                    </div>

                    <div style={{ marginBottom: '32px' }}>
                        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '8px', color: '#94A3B8' }}>Station Password</label>
                        <input className="input-field" type="password" placeholder="••••••••" onChange={e => setForm({ ...form, password: e.target.value })} required style={{ background: '#334155', border: 'none', color: 'white' }} />
                    </div>

                    <button className="btn btn-primary" disabled={loading} style={{ width: '100%', justifyContent: 'center', padding: '16px', borderRadius: '12px', fontWeight: 700, background: 'var(--accent)', color: 'black' }}>
                        {loading ? 'Initializing...' : 'Verify & Register Admin'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default function App() {
    const [cart, setCart] = useState([]);
    const onAdd = (p) => setCart([...cart, p]);
    const onRemove = (idx) => setCart(cart.filter((_, i) => i !== idx));

    return (
        <AuthProvider>
            <Router>
                <Routes>
                    <Route path="/login" element={<Login />} />
                    <Route path="/admin-login" element={<AdminLogin />} />
                    <Route path="/admin-signup" element={<AdminSignup />} />
                    <Route path="/signup" element={<Signup />} />

                    <Route path="/" element={<><Navbar cartCount={cart.length} /><HomePage onAdd={onAdd} /><Footer /></>} />
                    <Route path="/products" element={<><Navbar cartCount={cart.length} /><ProductsPage onAdd={onAdd} /><Footer /></>} />
                    <Route path="/booking" element={<><Navbar cartCount={cart.length} /><BookingPage /><Footer /></>} />
                    <Route path="/rental" element={<><Navbar cartCount={cart.length} /><RentalPage onAdd={onAdd} /><Footer /></>} />
                    <Route path="/cart" element={<><Navbar cartCount={cart.length} /><CartPage cart={cart} onRemove={onRemove} onClear={() => setCart([])} /><Footer /></>} />
                    <Route path="/profile" element={<><Navbar cartCount={cart.length} /><ProfilePage /><Footer /></>} />

                    <Route path="/admin" element={<ProtectedRoute role="ADMIN"><AdminLayout><AdminDashboard /></AdminLayout></ProtectedRoute>} />
                    <Route path="/admin/inventory" element={<ProtectedRoute role="ADMIN"><AdminLayout><AdminInventory /></AdminLayout></ProtectedRoute>} />
                    <Route path="/admin/orders" element={<ProtectedRoute role="ADMIN"><AdminLayout><AdminOrders /></AdminLayout></ProtectedRoute>} />
                    <Route path="/admin/bookings" element={<ProtectedRoute role="ADMIN"><AdminLayout><AdminBookings /></AdminLayout></ProtectedRoute>} />
                    <Route path="/admin/equipment" element={<ProtectedRoute role="ADMIN"><AdminLayout><AdminEquipment /></AdminLayout></ProtectedRoute>} />
                    <Route path="/admin/reports" element={<ProtectedRoute role="ADMIN"><AdminLayout><AdminReports /></AdminLayout></ProtectedRoute>} />

                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
                <AIChatbot />
            </Router>
        </AuthProvider>
    );
}
