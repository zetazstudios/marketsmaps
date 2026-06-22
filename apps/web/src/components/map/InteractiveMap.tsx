'use client';

import React, { useEffect, useRef, useState, useMemo } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { 
  Shield, 
  MapPin, 
  Store, 
  User, 
  Compass, 
  MessageSquare, 
  Search,
  ShoppingCart,
  Star,
  Plus,
  Minus,
  Trash2,
  Send,
  Check,
  Package,
  Play,
  Pause,
  Award,
  Music,
  CheckCircle,
  SlidersHorizontal,
  Settings,
  X,
  ChevronRight,
  Palette,
  Bell,
  LogOut,
  Camera,
  Edit3,
  Eye,
  BarChart3,
  PackagePlus,
  Image as ImageIcon,
  DollarSign,
  Tag,
  FileText,
  Zap,
  Globe,
  Lock,
  EyeOff,
  UserCheck,
  Mail,
  AlertCircle
} from 'lucide-react';
import { useGeolocation } from '../../hooks/useGeolocation';

// ============ Type Definitions ============

interface Product {
  id: string;
  name: string;
  price: number;
  description: string;
  image: string;
  isDigital: boolean;
  views?: number;
  sales?: number;
}

interface UserLocation {
  userId: string;
  name: string;
  avatarUrl: string | null;
  userType: 'personal' | 'artesano' | 'creador_digital' | 'comercial';
  reputation: number;
  isOnline: boolean;
  distanceMeters: number;
  location: { lat: number; lng: number } | null;
  products: Product[];
  bio: string;
  story?: string;
  mockReply: string;
  verified: boolean;
}

interface CartItem {
  product: Product;
  sellerId: string;
  sellerName: string;
  quantity: number;
}

interface Message {
  sender: 'buyer' | 'seller' | 'system';
  text: string;
  time: string;
  type?: 'text' | 'location' | 'audio' | 'order';
}

interface Order {
  id: string;
  buyerName: string;
  itemName: string;
  price: number;
  status: 'pending' | 'preparing' | 'ready';
  time: string;
}

interface UserProfile {
  name: string;
  email: string;
  bio: string;
  avatarUrl: string;
}

type AccentTheme = 'cyan' | 'purple' | 'emerald' | 'amber' | 'rose';
type SettingsTab = 'profile' | 'privacy' | 'appearance' | 'notifications' | 'support';

// ============ Accent Color Map ============
const accentColors: Record<AccentTheme, { name: string; class: string; hex: string }> = {
  cyan: { name: 'Cian', class: 'bg-cyan-500', hex: '#06b6d4' },
  purple: { name: 'Violeta', class: 'bg-purple-500', hex: '#a855f7' },
  emerald: { name: 'Esmeralda', class: 'bg-emerald-500', hex: '#10b981' },
  amber: { name: 'Ámbar', class: 'bg-amber-500', hex: '#f59e0b' },
  rose: { name: 'Rosa', class: 'bg-rose-500', hex: '#f43f5e' },
};

// Tailwind color utility by theme
function accentText(theme: AccentTheme) {
  const map: Record<AccentTheme, string> = { cyan: 'text-cyan-400', purple: 'text-purple-400', emerald: 'text-emerald-400', amber: 'text-amber-400', rose: 'text-rose-400' };
  return map[theme];
}
function accentBg(theme: AccentTheme) {
  const map: Record<AccentTheme, string> = { cyan: 'bg-cyan-500', purple: 'bg-purple-500', emerald: 'bg-emerald-500', amber: 'bg-amber-500', rose: 'bg-rose-500' };
  return map[theme];
}
function accentBgLight(theme: AccentTheme) {
  const map: Record<AccentTheme, string> = { cyan: 'bg-cyan-500/10', purple: 'bg-purple-500/10', emerald: 'bg-emerald-500/10', amber: 'bg-amber-500/10', rose: 'bg-rose-500/10' };
  return map[theme];
}
function accentBorder(theme: AccentTheme) {
  const map: Record<AccentTheme, string> = { cyan: 'border-cyan-500/40', purple: 'border-purple-500/40', emerald: 'border-emerald-500/40', amber: 'border-amber-500/40', rose: 'border-rose-500/40' };
  return map[theme];
}
function accentHoverBg(theme: AccentTheme) {
  const map: Record<AccentTheme, string> = { cyan: 'hover:bg-cyan-500', purple: 'hover:bg-purple-500', emerald: 'hover:bg-emerald-500', amber: 'hover:bg-amber-500', rose: 'hover:bg-rose-500' };
  return map[theme];
}
function accentShadow(theme: AccentTheme) {
  const map: Record<AccentTheme, string> = { cyan: 'shadow-cyan-500/15', purple: 'shadow-purple-500/15', emerald: 'shadow-emerald-500/15', amber: 'shadow-amber-500/15', rose: 'shadow-rose-500/15' };
  return map[theme];
}

export default function InteractiveMap() {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const { coords } = useGeolocation();
  
  const baseLat = coords?.lat || -33.4489;
  const baseLng = coords?.lng || -70.6693;

  // ============ Core State ============
  const [sellers, setSellers] = useState<UserLocation[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [privacyMode, setPrivacyMode] = useState<'exact' | 'approximate' | 'city' | 'invisible'>('approximate');
  const [selectedSeller, setSelectedSeller] = useState<UserLocation | null>(null);
  
  // UI Panels
  const [isSellerPanelOpen, setIsSellerPanelOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isSellerDashboardOpen, setIsSellerDashboardOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isPublishOpen, setIsPublishOpen] = useState(false);
  const [settingsTab, setSettingsTab] = useState<SettingsTab>('profile');
  const [viewMode, setViewMode] = useState<'map' | 'heatmap'>('map');

  // Theme
  const [accent, setAccent] = useState<AccentTheme>('cyan');

  // User Profile
  const [userProfile, setUserProfile] = useState<UserProfile>({
    name: 'Mi Perfil',
    email: 'usuario@marketsmaps.com',
    bio: 'Explorador del marketplace',
    avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=100&q=80'
  });
  const [editingProfile, setEditingProfile] = useState(false);
  const [profileDraft, setProfileDraft] = useState<UserProfile>({ ...userProfile });

  // Notifications state
  const [notifications, setNotifications] = useState({
    orders: true,
    messages: true,
    nearby: true,
    promotions: false,
  });

  // Support & Bug Report States
  const [reportType, setReportType] = useState<'bug' | 'suggestion' | 'other'>('bug');
  const [reportCategory, setReportCategory] = useState<string>('map');
  const [reportDescription, setReportDescription] = useState('');
  const [reportSteps, setReportSteps] = useState('');
  const [reportSubmitted, setReportSubmitted] = useState(false);
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);

  // User's own products (for Publish tab)
  const [myProducts, setMyProducts] = useState<Product[]>([
    {
      id: 'my-1',
      name: 'Pulsera de macramé artesanal',
      price: 12.00,
      description: 'Pulsera tejida a mano con hilo encerado y piedras naturales.',
      image: 'https://images.unsplash.com/photo-1611652022419-a9419f74343d?auto=format&fit=crop&w=200&q=80',
      isDigital: false,
      views: 234,
      sales: 18,
    }
  ]);
  const [showNewProductForm, setShowNewProductForm] = useState(false);
  const [newProduct, setNewProduct] = useState({ name: '', price: '', description: '', isDigital: false, image: '' });

  // Business Logic
  const [cart, setCart] = useState<CartItem[]>([]);
  const [chatOpen, setChatOpen] = useState<UserLocation | null>(null);
  const [chatMessages, setChatMessages] = useState<Record<string, Message[]>>({});
  const [chatInput, setChatInput] = useState('');
  const [isSellerTyping, setIsSellerTyping] = useState(false);
  const [checkoutStatus, setCheckoutStatus] = useState<string | null>(null);

  // Digital product player
  const [playingProductId, setPlayingProductId] = useState<string | null>(null);
  const [audioProgress, setAudioProgress] = useState<Record<string, number>>({});

  // Seller dashboard orders
  const [sellerOrders, setSellerOrders] = useState<Order[]>([
    { id: '1024', buyerName: 'Gabriel Soto', itemName: 'Taza Barro Esculpido', price: 18.00, status: 'pending', time: 'Hace 5 min' },
    { id: '1025', buyerName: 'María Luz', itemName: 'Synthwave Loop Pack #3', price: 25.00, status: 'preparing', time: 'Hace 15 min' }
  ]);

  // ============ Apply theme to DOM ============
  useEffect(() => {
    const themeMap: Record<AccentTheme, string> = {
      cyan: '',
      purple: 'purple',
      emerald: 'emerald',
      amber: 'amber',
      rose: 'rose',
    };
    const html = document.documentElement;
    if (accent === 'cyan') {
      html.removeAttribute('data-theme');
    } else {
      html.setAttribute('data-theme', themeMap[accent]);
    }
  }, [accent]);

  // ============ Initialize Sellers ============
  useEffect(() => {
    const list: UserLocation[] = [];
    setSellers(list);
  }, [baseLat, baseLng]);

  // ============ Filter sellers ============
  const filteredSellers = sellers.filter(seller => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    const matchSeller = seller.name.toLowerCase().includes(q) || seller.userType.toLowerCase().includes(q);
    const matchProduct = seller.products.some(p => p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q));
    return matchSeller || matchProduct;
  });

  // ============ Search results (enriched) ============
  const searchResults = useMemo(() => {
    if (!searchQuery || searchQuery.length < 2) return [];
    const q = searchQuery.toLowerCase();
    const results: { product: Product; seller: UserLocation }[] = [];
    sellers.forEach(seller => {
      seller.products.forEach(product => {
        if (
          product.name.toLowerCase().includes(q) ||
          product.description.toLowerCase().includes(q) ||
          seller.name.toLowerCase().includes(q)
        ) {
          results.push({ product, seller });
        }
      });
    });
    return results.slice(0, 8);
  }, [searchQuery, sellers]);

  // ============ Initialize Map ============
  useEffect(() => {
    if (map.current || !mapContainer.current) return;

    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json',
      center: [baseLng, baseLat],
      zoom: 14.5,
    });

    map.current.addControl(new maplibregl.NavigationControl(), 'bottom-right');

    return () => {
      map.current?.remove();
      map.current = null;
    };
  }, [baseLat, baseLng]);

  // ============ Redraw Markers ============
  useEffect(() => {
    if (!map.current) return;

    const markers = document.querySelectorAll('.mapboxgl-marker, .maplibregl-marker');
    markers.forEach(m => m.remove());

    // User geolocation marker with CIRCULAR zone
    if (privacyMode !== 'invisible') {
      let renderLat = baseLat;
      let renderLng = baseLng;

      if (privacyMode === 'approximate') {
        renderLat += 0.0018;
        renderLng -= 0.0015;
      } else if (privacyMode === 'city') {
        renderLat += 0.015;
        renderLng -= 0.025;
      }

      const myPosEl = document.createElement('div');
      myPosEl.style.cssText = 'display:flex;align-items:center;justify-content:center;position:relative;';
      
      // CIRCULAR elegant zone (not square)
      if (privacyMode === 'exact') {
        myPosEl.innerHTML = `
          <div style="width:28px;height:28px;border-radius:50%;background:radial-gradient(circle,${accentColors[accent].hex}33 0%,transparent 70%);position:absolute;animation:glowPulse 3s ease-in-out infinite;"></div>
          <div style="width:16px;height:16px;border-radius:50%;background:${accentColors[accent].hex};border:3px solid white;box-shadow:0 0 16px ${accentColors[accent].hex}88;position:relative;z-index:1;"></div>
        `;
      } else if (privacyMode === 'approximate') {
        myPosEl.innerHTML = `
          <div style="width:100px;height:100px;border-radius:50%;background:radial-gradient(circle,${accentColors[accent].hex}18 0%,${accentColors[accent].hex}08 50%,transparent 70%);border:1.5px dashed ${accentColors[accent].hex}55;position:absolute;animation:glowPulse 4s ease-in-out infinite;"></div>
          <div style="width:14px;height:14px;border-radius:50%;background:${accentColors[accent].hex};border:3px solid white;box-shadow:0 0 12px ${accentColors[accent].hex}66;position:relative;z-index:1;"></div>
        `;
      } else if (privacyMode === 'city') {
        myPosEl.innerHTML = `
          <div style="width:200px;height:200px;border-radius:50%;background:radial-gradient(circle,${accentColors[accent].hex}10 0%,${accentColors[accent].hex}05 40%,transparent 65%);border:1px dotted ${accentColors[accent].hex}33;position:absolute;animation:glowPulse 5s ease-in-out infinite;"></div>
          <div style="width:12px;height:12px;border-radius:50%;background:${accentColors[accent].hex};border:2px solid white;box-shadow:0 0 10px ${accentColors[accent].hex}44;position:relative;z-index:1;"></div>
        `;
      }

      new maplibregl.Marker({ element: myPosEl })
        .setLngLat([renderLng, renderLat])
        .addTo(map.current);
    }

    // Seller markers
    filteredSellers.forEach(seller => {
      if (!seller.location) return;

      const sellerEl = document.createElement('div');
      sellerEl.className = 'cursor-pointer';
      sellerEl.style.cssText = 'display:flex;flex-direction:column;align-items:center;position:relative;';

      let ringColor = '#64748b';
      let glowColor = 'transparent';
      let typeBadge = '';
      
      if (seller.userType === 'artesano') {
        ringColor = '#a855f7';
        glowColor = 'rgba(168,85,247,0.2)';
        typeBadge = `<span style="position:absolute;top:-3px;left:-3px;background:#a855f7;color:white;border-radius:50%;width:14px;height:14px;display:flex;align-items:center;justify-content:center;font-size:8px;border:2px solid #090C16;">✦</span>`;
      } else if (seller.userType === 'creador_digital') {
        ringColor = '#06b6d4';
        glowColor = 'rgba(6,182,212,0.2)';
        typeBadge = `<span style="position:absolute;top:-3px;left:-3px;background:#06b6d4;color:#0f172a;border-radius:50%;width:14px;height:14px;display:flex;align-items:center;justify-content:center;font-size:8px;border:2px solid #090C16;">⚡</span>`;
      } else if (seller.userType === 'comercial') {
        ringColor = '#10b981';
        glowColor = 'rgba(16,185,129,0.2)';
      } else {
        ringColor = '#f59e0b';
        glowColor = 'rgba(245,158,11,0.2)';
      }

      const verifiedBadge = seller.verified ? `<span style="position:absolute;bottom:-2px;right:-2px;background:${accentColors[accent].hex};color:#0f172a;border-radius:50%;width:14px;height:14px;display:flex;align-items:center;justify-content:center;border:2px solid #090C16;"><svg width="8" height="8" viewBox="0 0 24 24" fill="currentColor"><path d="M20.285 2l-11.285 11.567-5.286-5.011-3.714 3.716 9 8.728 15-15.285z"/></svg></span>` : '';

      sellerEl.innerHTML = `
        <div style="position:relative;width:48px;height:48px;background:#090C16;border-radius:50%;border:2.5px solid ${ringColor};display:flex;align-items:center;justify-content:center;box-shadow:0 0 20px ${glowColor},0 4px 15px rgba(0,0,0,0.4);transition:transform 0.3s cubic-bezier(0.34,1.56,0.64,1);cursor:pointer;">
          <img src="${seller.avatarUrl || 'https://via.placeholder.com/100'}" style="width:40px;height:40px;border-radius:50%;object-fit:cover;" />
          ${typeBadge}
          ${verifiedBadge}
          <span style="position:absolute;bottom:2px;left:2px;width:8px;height:8px;background:#10b981;border-radius:50%;border:2px solid #090C16;"></span>
        </div>
        <div style="position:absolute;bottom:56px;background:rgba(10,13,24,0.95);border:1px solid #1e293b;color:white;font-size:10px;padding:6px 10px;border-radius:10px;box-shadow:0 8px 30px rgba(0,0,0,0.5);white-space:nowrap;transform:scale(0);transition:transform 0.2s cubic-bezier(0.34,1.56,0.64,1);pointer-events:none;backdrop-filter:blur(12px);">
          <div style="font-weight:700;display:flex;align-items:center;gap:4px;">
            ${seller.name}
            <span style="color:#fbbf24;display:flex;align-items:center;gap:2px;">★${seller.reputation}</span>
          </div>
          <div style="color:#94a3b8;text-transform:capitalize;font-size:9px;margin-top:2px;">${seller.userType === 'creador_digital' ? 'creador digital' : seller.userType} · ${seller.distanceMeters}m</div>
        </div>
      `;

      sellerEl.addEventListener('mouseenter', () => {
        const tooltip = sellerEl.querySelector('div > div:last-child') as HTMLElement;
        if (tooltip) tooltip.style.transform = 'scale(1)';
        const avatar = sellerEl.querySelector('div > div:first-child') as HTMLElement;
        if (avatar) avatar.style.transform = 'scale(1.15)';
      });
      sellerEl.addEventListener('mouseleave', () => {
        const tooltip = sellerEl.querySelector('div > div:last-child') as HTMLElement;
        if (tooltip) tooltip.style.transform = 'scale(0)';
        const avatar = sellerEl.querySelector('div > div:first-child') as HTMLElement;
        if (avatar) avatar.style.transform = 'scale(1)';
      });

      sellerEl.addEventListener('click', (e) => {
        e.stopPropagation();
        setSelectedSeller(seller);
        setIsSellerPanelOpen(true);
        closeAllPanelsExcept('seller');
        map.current?.flyTo({
          center: [seller.location!.lng, seller.location!.lat],
          zoom: 15.5,
          essential: true
        });
      });

      new maplibregl.Marker({ element: sellerEl })
        .setLngLat([seller.location.lng, seller.location.lat])
        .addTo(map.current!);
    });
  }, [filteredSellers, privacyMode, baseLat, baseLng, accent]);

  // Audio player timer
  useEffect(() => {
    if (playingProductId === null) return;
    const interval = setInterval(() => {
      setAudioProgress(prev => {
        const currentVal = prev[playingProductId] || 0;
        if (currentVal >= 100) {
          setPlayingProductId(null);
          return { ...prev, [playingProductId]: 0 };
        }
        return { ...prev, [playingProductId]: currentVal + 5 };
      });
    }, 250);
    return () => clearInterval(interval);
  }, [playingProductId]);

  // ============ Helper Functions ============
  
  function closeAllPanelsExcept(keep?: string) {
    if (keep !== 'seller') setIsSellerPanelOpen(false);
    if (keep !== 'cart') setIsCartOpen(false);
    if (keep !== 'dashboard') setIsSellerDashboardOpen(false);
    if (keep !== 'settings') setIsSettingsOpen(false);
    if (keep !== 'publish') setIsPublishOpen(false);
  }

  const handleAddToCart = (product: Product, seller: UserLocation) => {
    setCart(prevCart => {
      const existing = prevCart.find(item => item.product.id === product.id);
      if (existing) {
        return prevCart.map(item => 
          item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prevCart, { product, sellerId: seller.userId, sellerName: seller.name, quantity: 1 }];
    });
  };

  const handleUpdateCartQuantity = (productId: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.product.id === productId) {
        const newQty = item.quantity + delta;
        return newQty > 0 ? { ...item, quantity: newQty } : item;
      }
      return item;
    }).filter(item => item.quantity > 0));
  };

  const handleRemoveFromCart = (productId: string) => {
    setCart(prev => prev.filter(item => item.product.id !== productId));
  };

  const cartCount = cart.reduce((acc, curr) => acc + curr.quantity, 0);
  const cartTotal = cart.reduce((acc, curr) => acc + (curr.product.price * curr.quantity), 0);

  // Send message
  const handleSendMessage = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!chatInput.trim() || !chatOpen) return;

    const userMessage: Message = {
      sender: 'buyer',
      text: chatInput,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    const targetSellerId = chatOpen.userId;
    setChatMessages(prev => ({
      ...prev,
      [targetSellerId]: [...(prev[targetSellerId] || []), userMessage]
    }));
    setChatInput('');
    setIsSellerTyping(true);
    
    setTimeout(() => {
      setIsSellerTyping(false);
      const replyMessage: Message = {
        sender: 'seller',
        text: chatOpen.mockReply,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setChatMessages(prev => ({
        ...prev,
        [targetSellerId]: [...(prev[targetSellerId] || []), replyMessage]
      }));
    }, 1500);
  };

  // Checkout with auto-chat creation
  const handleCheckout = () => {
    if (cart.length === 0) return;
    setCheckoutStatus('loading');
    setTimeout(() => {
      setCheckoutStatus('success');
      
      // Create orders for dashboard
      const newOrders: Order[] = cart.map((item, idx) => ({
        id: (1026 + idx).toString(),
        buyerName: userProfile.name,
        itemName: item.product.name,
        price: item.product.price * item.quantity,
        status: 'pending' as const,
        time: 'Hace un momento'
      }));
      setSellerOrders(prev => [...newOrders, ...prev]);

      // AUTO-CREATE CHATS with each seller involved
      const sellerIds = cart.map(item => item.sellerId).filter((value, index, self) => self.indexOf(value) === index);
      sellerIds.forEach(sellerId => {
        const seller = sellers.find(s => s.userId === sellerId);
        if (!seller) return;
        
        const sellerItems = cart.filter(item => item.sellerId === sellerId);
        const itemsList = sellerItems.map(item => `• ${item.product.name} x${item.quantity} ($${(item.product.price * item.quantity).toFixed(2)})`).join('\n');
        const totalForSeller = sellerItems.reduce((acc, item) => acc + item.product.price * item.quantity, 0);
        
        const orderMessage: Message = {
          sender: 'system',
          text: `📦 Nuevo pedido realizado:\n${itemsList}\n\n💰 Total: $${totalForSeller.toFixed(2)}`,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          type: 'order'
        };

        const greeting: Message = {
          sender: 'buyer',
          text: `¡Hola ${seller.name}! Acabo de hacer un pedido. ¿Podrías confirmarme la disponibilidad?`,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };

        setChatMessages(prev => ({
          ...prev,
          [sellerId]: [...(prev[sellerId] || []), orderMessage, greeting]
        }));

        // Auto-open chat with the first seller
        if (sellerId === sellerIds[0]) {
          setTimeout(() => {
            setChatOpen(seller);
          }, 2500);
        }
      });

      setCart([]);
      
      setTimeout(() => {
        setCheckoutStatus(null);
        setIsCartOpen(false);
      }, 3000);
    }, 1200);
  };

  const handleUpdateOrderStatus = (orderId: string, nextStatus: 'preparing' | 'ready') => {
    setSellerOrders(prev => prev.map(ord => ord.id === orderId ? { ...ord, status: nextStatus } : ord));
  };

  const handleTogglePlay = (productId: string) => {
    if (playingProductId === productId) {
      setPlayingProductId(null);
    } else {
      setPlayingProductId(productId);
      if (!(productId in audioProgress)) {
        setAudioProgress(prev => ({ ...prev, [productId]: 0 }));
      }
    }
  };

  const handleSelectSearchResult = (seller: UserLocation) => {
    setSearchQuery('');
    setIsSearchFocused(false);
    setSelectedSeller(seller);
    setIsSellerPanelOpen(true);
    closeAllPanelsExcept('seller');
    if (seller.location) {
      map.current?.flyTo({ center: [seller.location.lng, seller.location.lat], zoom: 15.5, essential: true });
    }
  };

  // Publish new product
  const handlePublishProduct = () => {
    if (!newProduct.name || !newProduct.price) return;
    const product: Product = {
      id: `my-${Date.now()}`,
      name: newProduct.name,
      price: parseFloat(newProduct.price) || 0,
      description: newProduct.description,
      image: newProduct.image || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=200&q=80',
      isDigital: newProduct.isDigital,
      views: 0,
      sales: 0,
    };
    setMyProducts(prev => [product, ...prev]);
    setNewProduct({ name: '', price: '', description: '', isDigital: false, image: '' });
    setShowNewProductForm(false);
  };

  const handleDeleteMyProduct = (productId: string) => {
    setMyProducts(prev => prev.filter(p => p.id !== productId));
  };

  // Save profile
  const handleSaveProfile = () => {
    setUserProfile({ ...profileDraft });
    setEditingProfile(false);
  };

  // Submit bug report
  const handleSubmitReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportDescription.trim()) return;
    setIsSubmittingReport(true);

    const reportData = {
      type: reportType,
      category: reportCategory,
      description: reportDescription,
      steps: reportSteps || undefined,
      userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'unknown',
    };

    // Save report to localStorage (local log)
    try {
      const existingReportsJson = localStorage.getItem('marketsmaps_bug_reports');
      const existingReports = existingReportsJson ? JSON.parse(existingReportsJson) : [];
      existingReports.push({ ...reportData, id: `report-${Date.now()}`, timestamp: new Date().toISOString() });
      localStorage.setItem('marketsmaps_bug_reports', JSON.stringify(existingReports));
    } catch (err) {
      console.error('Error saving bug report to localStorage:', err);
    }

    // HTTP POST call to real NestJS backend
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';
    try {
      const response = await fetch(`${API_URL}/reports`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(reportData),
      });

      if (!response.ok) {
        throw new Error('Server responded with an error status');
      }
    } catch (err) {
      console.error('Failed to submit bug report to backend API, falling back to email client...', err);
      
      // Fallback: Open mailto link if API is down/offline
      const subject = encodeURIComponent(`[MarketsMaps Bug Report] ${reportType.toUpperCase()}: ${reportCategory}`);
      const body = encodeURIComponent(
        `Detalles del Reporte de Falla:\n` +
        `----------------------------------\n` +
        `Tipo: ${reportType}\n` +
        `Categoría: ${reportCategory}\n` +
        `Fecha: ${new Date().toISOString()}\n\n` +
        `Descripción:\n${reportDescription}\n\n` +
        `Pasos para reproducir:\n${reportSteps || 'N/A'}\n\n` +
        `Dispositivo:\n${reportData.userAgent}\n` +
        `----------------------------------`
      );
      
      if (typeof window !== 'undefined') {
        window.location.href = `mailto:soporte@marketsmaps.com?subject=${subject}&body=${body}`;
      }
    }

    setIsSubmittingReport(false);
    setReportSubmitted(true);
    setTimeout(() => {
      setReportDescription('');
      setReportSteps('');
      setReportSubmitted(false);
    }, 5000);
  };

  // ============ RENDER ============
  return (
    <div className="relative w-full h-screen overflow-hidden bg-[#07090E] text-slate-100 font-sans selection:bg-cyan-500/30 selection:text-cyan-200">
      
      {/* Map Container */}
      <div ref={mapContainer} className="absolute inset-0 w-full h-full" />

      {/* ======== HEADER ======== */}
      <div className="absolute top-0 inset-x-0 z-10 pointer-events-none">
        <div className="flex items-center justify-between px-4 pt-4 pb-2">
          
          {/* Search Engine */}
          <div className="relative pointer-events-auto">
            <div className={`flex items-center gap-2.5 glass-panel px-4 py-3 rounded-2xl w-72 md:w-[420px] transition-all duration-300 ${isSearchFocused ? 'ring-1 ring-white/10 shadow-lg' : ''}`}>
              <Search className={`w-4 h-4 flex-shrink-0 ${accentText(accent)}`} />
              <input 
                type="text" 
                placeholder="Buscar productos, artesanos, beats, tiendas..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setIsSearchFocused(true)}
                onBlur={() => setTimeout(() => setIsSearchFocused(false), 250)}
                className="bg-transparent outline-none text-white text-[13px] w-full placeholder-slate-500 font-medium"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="text-slate-500 hover:text-white transition p-0.5">
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Search Results Dropdown (Enriched) */}
            {isSearchFocused && (searchQuery.length >= 2 ? searchResults.length > 0 : true) && (
              <div className="absolute top-full left-0 right-0 mt-2 glass-panel rounded-2xl p-2 z-50 animate-scale-in max-h-80 overflow-y-auto">
                {searchQuery.length < 2 ? (
                  <>
                    <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider px-3 py-2 block">Tendencias</span>
                    {[
                      { label: 'Cerámica artesanal cerca mío', term: 'cerámica' },
                      { label: 'Beat trap o synthwave', term: 'beat' },
                      { label: 'Ropa vintage retro', term: 'vintage' },
                      { label: 'Miel orgánica natural', term: 'miel' }
                    ].map((rec, idx) => (
                      <button
                        key={idx}
                        onClick={() => { setSearchQuery(rec.term); }}
                        className="text-left text-xs px-3 py-2 rounded-xl text-slate-300 hover:bg-white/5 transition-all flex items-center gap-2.5 font-medium w-full"
                      >
                        <Search className="w-3.5 h-3.5 text-slate-600 flex-shrink-0" />
                        {rec.label}
                      </button>
                    ))}
                  </>
                ) : searchResults.length > 0 ? (
                  <>
                    <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider px-3 py-2 block">
                      {searchResults.length} resultado{searchResults.length !== 1 ? 's' : ''}
                    </span>
                    {searchResults.map(({ product, seller }, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleSelectSearchResult(seller)}
                        className="text-left px-3 py-2.5 rounded-xl hover:bg-white/5 transition-all flex items-center gap-3 w-full group"
                      >
                        <img 
                          src={product.image} 
                          className="w-10 h-10 rounded-lg object-cover bg-slate-900 flex-shrink-0" 
                        />
                        <div className="flex-1 min-w-0">
                          <div className="text-[12px] font-bold text-white truncate group-hover:text-white/90">
                            {product.name}
                            {product.isDigital && (
                              <span className={`ml-1.5 text-[8px] font-black px-1.5 py-0.5 rounded ${accentBg(accent)} text-slate-950 inline-block align-middle`}>DIGITAL</span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[10px] text-slate-400 truncate">{seller.name}</span>
                            <span className="text-[10px] text-slate-600">·</span>
                            <span className={`text-[11px] font-bold ${accentText(accent)}`}>${product.price.toFixed(2)}</span>
                            <span className="text-[10px] text-slate-600">·</span>
                            <span className="text-[10px] text-slate-500 flex items-center gap-0.5">
                              <MapPin className="w-2.5 h-2.5" />
                              {seller.distanceMeters}m
                            </span>
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-slate-400 transition flex-shrink-0" />
                      </button>
                    ))}
                  </>
                ) : (
                  <div className="text-center py-6 text-slate-500 text-xs">
                    No se encontraron resultados
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Action Icons */}
          <div className="flex gap-1.5 pointer-events-auto">
            {/* Publish */}
            <button 
              onClick={() => { setIsPublishOpen(true); closeAllPanelsExcept('publish'); }}
              className="p-2.5 glass-panel rounded-xl flex items-center justify-center gap-1.5 transition-all duration-200 hover:bg-white/5 group"
              title="Mis Publicaciones"
            >
              <PackagePlus className={`w-4 h-4 ${accentText(accent)} transition`} />
              <span className="text-[10px] font-bold text-slate-400 hidden lg:inline group-hover:text-white transition">Publicar</span>
            </button>

            {/* Seller Dashboard */}
            <button 
              onClick={() => { setIsSellerDashboardOpen(true); closeAllPanelsExcept('dashboard'); }}
              className="p-2.5 glass-panel rounded-xl flex items-center justify-center gap-1.5 transition-all duration-200 hover:bg-white/5 group"
              title="Panel de Vendedor"
            >
              <SlidersHorizontal className={`w-4 h-4 ${accentText(accent)} transition`} />
              <span className="text-[10px] font-bold text-slate-400 hidden lg:inline group-hover:text-white transition">Panel</span>
            </button>

            {/* Heatmap toggle */}
            <button 
              onClick={() => setViewMode(viewMode === 'map' ? 'heatmap' : 'map')}
              className={`p-2.5 rounded-xl transition-all duration-200 ${
                viewMode === 'heatmap' 
                  ? `${accentBg(accent)} text-slate-950 font-bold shadow-lg ${accentShadow(accent)}` 
                  : 'glass-panel text-slate-400 hover:bg-white/5 hover:text-white'
              }`}
              title="Mapa de Calor"
            >
              <Compass className="w-4 h-4" />
            </button>
            
            {/* Cart */}
            <button 
              onClick={() => { setIsCartOpen(true); closeAllPanelsExcept('cart'); }}
              className="p-2.5 glass-panel rounded-xl flex items-center justify-center relative transition-all duration-200 hover:bg-white/5"
              title="Carrito"
            >
              <ShoppingCart className="w-4 h-4 text-slate-400" />
              {cartCount > 0 && (
                <span className={`absolute -top-1 -right-1 ${accentBg(accent)} text-slate-950 text-[9px] font-black w-5 h-5 rounded-full flex items-center justify-center border-2 border-[#07090E]`}>
                  {cartCount}
                </span>
              )}
            </button>

            {/* Settings */}
            <button 
              onClick={() => { setIsSettingsOpen(true); closeAllPanelsExcept('settings'); }}
              className="p-2.5 glass-panel rounded-xl flex items-center justify-center transition-all duration-200 hover:bg-white/5 group"
              title="Configuración"
            >
              <Settings className="w-4 h-4 text-slate-400 group-hover:text-white transition group-hover:rotate-90 duration-500" />
            </button>
          </div>
        </div>
      </div>

      {/* ======== SETTINGS PANEL ======== */}
      {isSettingsOpen && (
        <div className="absolute inset-y-4 right-4 w-[400px] glass-panel rounded-2xl z-20 flex flex-col overflow-hidden animate-slide-in">
          {/* Header */}
          <div className="p-5 border-b border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-9 h-9 rounded-xl ${accentBgLight(accent)} flex items-center justify-center`}>
                <Settings className={`w-4 h-4 ${accentText(accent)}`} />
              </div>
              <h3 className="text-white font-bold text-sm">Configuración</h3>
            </div>
            <button onClick={() => setIsSettingsOpen(false)} className="text-slate-500 hover:text-white p-1.5 rounded-lg hover:bg-white/5 transition">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-white/5 px-2 overflow-x-auto scrollbar-none">
            {([
              { id: 'profile', icon: User, label: 'Perfil' },
              { id: 'privacy', icon: Shield, label: 'Privacidad' },
              { id: 'appearance', icon: Palette, label: 'Tema' },
              { id: 'notifications', icon: Bell, label: 'Alertas' },
              { id: 'support', icon: AlertCircle, label: 'Soporte' },
            ] as { id: SettingsTab; icon: any; label: string }[]).map(tab => (
              <button
                key={tab.id}
                onClick={() => setSettingsTab(tab.id)}
                className={`flex-1 py-3 text-[10px] font-bold uppercase tracking-wider flex flex-col items-center gap-1.5 transition-all border-b-2 ${
                  settingsTab === tab.id 
                    ? `${accentText(accent)} border-current` 
                    : 'text-slate-500 border-transparent hover:text-slate-300'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>

          {/* Settings Content */}
          <div className="flex-1 overflow-y-auto p-5 space-y-5">
            
            {/* Profile Tab */}
            {settingsTab === 'profile' && (
              <div className="space-y-5 animate-fade-in">
                <div className="flex items-center gap-4">
                  <div className="relative group">
                    <img src={userProfile.avatarUrl} className="w-16 h-16 rounded-2xl object-cover border border-white/10" />
                    <div className="absolute inset-0 rounded-2xl bg-black/50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center cursor-pointer">
                      <Camera className="w-5 h-5 text-white" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <h4 className="text-white font-bold text-sm">{userProfile.name}</h4>
                    <p className="text-xs text-slate-500 mt-0.5">{userProfile.email}</p>
                    <button 
                      onClick={() => { setEditingProfile(!editingProfile); setProfileDraft({ ...userProfile }); }}
                      className={`text-[10px] font-bold mt-2 flex items-center gap-1 transition ${accentText(accent)} hover:underline`}
                    >
                      <Edit3 className="w-3 h-3" />
                      {editingProfile ? 'Cancelar' : 'Editar Perfil'}
                    </button>
                  </div>
                </div>

                {editingProfile && (
                  <div className="space-y-3 bg-white/[0.02] p-4 rounded-xl border border-white/5 animate-scale-in">
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Nombre</label>
                      <input 
                        value={profileDraft.name} 
                        onChange={(e) => setProfileDraft(p => ({ ...p, name: e.target.value }))}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white outline-none focus:border-white/20 transition font-medium"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
                        <Mail className="w-3 h-3 inline mr-1" />Email
                      </label>
                      <input 
                        value={profileDraft.email} 
                        onChange={(e) => setProfileDraft(p => ({ ...p, email: e.target.value }))}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white outline-none focus:border-white/20 transition font-medium"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Bio</label>
                      <textarea 
                        value={profileDraft.bio} 
                        onChange={(e) => setProfileDraft(p => ({ ...p, bio: e.target.value }))}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white outline-none focus:border-white/20 transition font-medium resize-none h-20"
                      />
                    </div>
                    <button 
                      onClick={handleSaveProfile}
                      className={`w-full ${accentBg(accent)} text-slate-950 font-bold py-2.5 rounded-xl text-xs transition hover:opacity-90 flex items-center justify-center gap-2`}
                    >
                      <Check className="w-3.5 h-3.5" />
                      Guardar Cambios
                    </button>
                  </div>
                )}

                <div className="pt-3 border-t border-white/5 space-y-2">
                  <h5 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Cuenta</h5>
                  <div className="bg-white/[0.02] rounded-xl border border-white/5 divide-y divide-white/5">
                    <button className="w-full flex items-center justify-between px-4 py-3 text-xs text-slate-300 hover:bg-white/5 transition rounded-t-xl">
                      <span className="flex items-center gap-2"><UserCheck className="w-3.5 h-3.5 text-slate-500" /> Verificación de identidad</span>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
                    </button>
                    <button className="w-full flex items-center justify-between px-4 py-3 text-xs text-slate-300 hover:bg-white/5 transition">
                      <span className="flex items-center gap-2"><Lock className="w-3.5 h-3.5 text-slate-500" /> Cambiar contraseña</span>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
                    </button>
                    <button className="w-full flex items-center justify-between px-4 py-3 text-xs text-slate-300 hover:bg-white/5 transition rounded-b-xl">
                      <span className="flex items-center gap-2"><Globe className="w-3.5 h-3.5 text-slate-500" /> Idioma</span>
                      <span className="text-slate-500 text-[10px]">Español</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Privacy Tab */}
            {settingsTab === 'privacy' && (
              <div className="space-y-4 animate-fade-in">
                <div className="flex items-center gap-2 mb-1">
                  <Shield className={`w-4 h-4 ${accentText(accent)}`} />
                  <span className="text-xs font-bold text-white">Privacidad de Ubicación</span>
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed -mt-2">
                  Controla cómo otros usuarios ven tu posición en el mapa.
                </p>
                
                <div className="flex flex-col gap-2">
                  {[
                    { id: 'exact' as const, icon: MapPin, label: 'Ubicación Exacta', desc: 'Muestra tu posición real en vivo', color: 'text-emerald-400' },
                    { id: 'approximate' as const, icon: Globe, label: 'Zona Aproximada (300m)', desc: 'Desfase geoespacial aleatorio', color: 'text-cyan-400' },
                    { id: 'city' as const, icon: Store, label: 'Ciudad / Región', desc: 'Solo muestra coordenadas del centroide', color: 'text-amber-400' },
                    { id: 'invisible' as const, icon: EyeOff, label: 'Invisible', desc: 'Completamente oculto del mapa', color: 'text-slate-400' },
                  ].map(opt => (
                    <button
                      key={opt.id}
                      onClick={() => setPrivacyMode(opt.id)}
                      className={`text-left p-3.5 rounded-xl border transition-all duration-200 flex items-start gap-3 ${
                        privacyMode === opt.id 
                          ? `${accentBgLight(accent)} ${accentBorder(accent)} shadow-sm` 
                          : 'bg-transparent border-white/5 hover:bg-white/[0.03]'
                      }`}
                    >
                      <opt.icon className={`w-4 h-4 mt-0.5 flex-shrink-0 ${privacyMode === opt.id ? accentText(accent) : opt.color}`} />
                      <div>
                        <span className={`font-bold text-[11px] block ${privacyMode === opt.id ? 'text-white' : 'text-slate-300'}`}>
                          {opt.label}
                        </span>
                        <span className="text-[9px] text-slate-500 leading-normal">{opt.desc}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Appearance Tab */}
            {settingsTab === 'appearance' && (
              <div className="space-y-5 animate-fade-in">
                <div>
                  <h5 className="text-xs font-bold text-white mb-1">Color de Acento</h5>
                  <p className="text-[10px] text-slate-500 mb-4">Elige el color principal de la interfaz</p>
                  <div className="grid grid-cols-5 gap-3">
                    {(Object.keys(accentColors) as AccentTheme[]).map(key => (
                      <button
                        key={key}
                        onClick={() => setAccent(key)}
                        className={`flex flex-col items-center gap-2 p-3 rounded-xl border transition-all duration-200 ${
                          accent === key 
                            ? 'border-white/20 bg-white/5 shadow-sm' 
                            : 'border-transparent hover:bg-white/[0.03]'
                        }`}
                      >
                        <div className={`w-8 h-8 rounded-full ${accentColors[key].class} shadow-lg transition-transform ${accent === key ? 'scale-110 ring-2 ring-white/30 ring-offset-2 ring-offset-[#0A0D18]' : ''}`} />
                        <span className="text-[9px] font-bold text-slate-400 uppercase">{accentColors[key].name}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="pt-3 border-t border-white/5">
                  <h5 className="text-xs font-bold text-white mb-3">Vista del Mapa</h5>
                  <div className="grid grid-cols-2 gap-2">
                    <button className="p-3 rounded-xl border border-white/10 bg-white/5 text-center">
                      <div className="text-[10px] font-bold text-white">Oscuro</div>
                      <div className="text-[9px] text-slate-500">Tema actual</div>
                    </button>
                    <button className="p-3 rounded-xl border border-white/5 hover:bg-white/[0.03] transition text-center opacity-50 cursor-not-allowed">
                      <div className="text-[10px] font-bold text-slate-400">Claro</div>
                      <div className="text-[9px] text-slate-600">Próximamente</div>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Notifications Tab */}
            {settingsTab === 'notifications' && (
              <div className="space-y-3 animate-fade-in">
                <p className="text-[11px] text-slate-500 mb-2">Gestiona qué notificaciones deseas recibir</p>
                {[
                  { key: 'orders' as const, label: 'Pedidos', desc: 'Recibe alertas cuando un pedido cambie de estado', icon: Package },
                  { key: 'messages' as const, label: 'Mensajes', desc: 'Notificaciones de nuevos mensajes de chat', icon: MessageSquare },
                  { key: 'nearby' as const, label: 'Vendedores cercanos', desc: 'Alerta cuando un vendedor nuevo aparezca cerca', icon: MapPin },
                  { key: 'promotions' as const, label: 'Promociones', desc: 'Ofertas y descuentos de vendedores que sigues', icon: Tag },
                ].map(notif => (
                  <div key={notif.key} className="flex items-center justify-between p-3.5 rounded-xl bg-white/[0.02] border border-white/5">
                    <div className="flex items-center gap-3">
                      <notif.icon className="w-4 h-4 text-slate-500 flex-shrink-0" />
                      <div>
                        <span className="text-[11px] font-bold text-white block">{notif.label}</span>
                        <span className="text-[9px] text-slate-500">{notif.desc}</span>
                      </div>
                    </div>
                    <button 
                      onClick={() => setNotifications(prev => ({ ...prev, [notif.key]: !prev[notif.key] }))}
                      className={`w-10 h-6 rounded-full transition-all duration-300 flex items-center px-1 ${
                        notifications[notif.key] ? accentBg(accent) : 'bg-slate-700'
                      }`}
                    >
                      <div className={`w-4 h-4 rounded-full bg-white shadow transition-transform duration-300 ${notifications[notif.key] ? 'translate-x-4' : 'translate-x-0'}`} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Support / Bug Report Tab */}
            {settingsTab === 'support' && (
              <div className="space-y-4 animate-fade-in">
                <div className="flex items-center gap-2 mb-1">
                  <AlertCircle className={`w-4 h-4 ${accentText(accent)}`} />
                  <span className="text-xs font-bold text-white">Soporte y Reporte de Fallas</span>
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed -mt-2">
                  ¿Encontraste un problema en la aplicación o tienes una sugerencia? Envíala directamente a nuestro equipo técnico.
                </p>

                {reportSubmitted ? (
                  <div className="bg-emerald-500/5 border border-emerald-500/25 p-5 rounded-xl text-center space-y-3 animate-scale-in">
                    <div className={`w-10 h-10 ${accentBgLight(accent)} border ${accentBorder(accent)} rounded-full flex items-center justify-center mx-auto`}>
                      <Check className={`w-5 h-5 ${accentText(accent)}`} />
                    </div>
                    <h5 className="text-white font-bold text-xs">¡Reporte Enviado!</h5>
                    <p className="text-[10px] text-slate-400 leading-relaxed">
                      Muchas gracias por ayudarnos a mejorar. Nuestro equipo revisará el informe de inmediato.
                    </p>
                  </div>
                ) : (
                  <form onSubmit={handleSubmitReport} className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Tipo de reporte</label>
                        <select 
                          value={reportType}
                          onChange={(e: any) => setReportType(e.target.value)}
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white outline-none focus:border-white/20 transition font-medium"
                        >
                          <option value="bug" className="bg-[#0A0D18] text-white">Falla / Error</option>
                          <option value="suggestion" className="bg-[#0A0D18] text-white">Sugerencia</option>
                          <option value="other" className="bg-[#0A0D18] text-white">Otro</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Categoría</label>
                        <select 
                          value={reportCategory}
                          onChange={(e: any) => setReportCategory(e.target.value)}
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white outline-none focus:border-white/20 transition font-medium"
                        >
                          <option value="map" className="bg-[#0A0D18] text-white">Mapa / GPS</option>
                          <option value="search" className="bg-[#0A0D18] text-white">Buscador</option>
                          <option value="cart" className="bg-[#0A0D18] text-white">Carrito / Pago</option>
                          <option value="chat" className="bg-[#0A0D18] text-white">Mensajería</option>
                          <option value="other" className="bg-[#0A0D18] text-white">Otro módulo</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Descripción del problema</label>
                      <textarea 
                        value={reportDescription}
                        onChange={(e) => setReportDescription(e.target.value)}
                        placeholder="Describe detalladamente qué ocurrió..."
                        required
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white outline-none focus:border-white/20 transition placeholder-slate-600 font-medium resize-none h-20"
                      />
                    </div>

                    {reportType === 'bug' && (
                      <div>
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Pasos para reproducir (Opcional)</label>
                        <textarea 
                          value={reportSteps}
                          onChange={(e) => setReportSteps(e.target.value)}
                          placeholder="1. Presioné añadir al carrito&#10;2. El botón no cambió..."
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white outline-none focus:border-white/20 transition placeholder-slate-600 font-medium resize-none h-16"
                        />
                      </div>
                    )}

                    <button 
                      type="submit"
                      disabled={isSubmittingReport || !reportDescription.trim()}
                      className={`w-full ${accentBg(accent)} disabled:opacity-30 text-slate-950 font-bold py-2.5 rounded-xl text-xs transition flex items-center justify-center gap-2`}
                    >
                      {isSubmittingReport ? 'Enviando...' : <><Send className="w-3.5 h-3.5" /> Enviar Reporte</>}
                    </button>
                  </form>
                )}
              </div>
            )}
          </div>

          {/* Logout */}
          <div className="p-4 border-t border-white/5">
            <button className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500/20 transition text-xs font-bold border border-red-500/20">
              <LogOut className="w-4 h-4" />
              Cerrar Sesión
            </button>
          </div>
        </div>
      )}

      {/* ======== PUBLISH PANEL ======== */}
      {isPublishOpen && (
        <div className="absolute inset-y-4 right-4 w-[400px] glass-panel rounded-2xl z-20 flex flex-col overflow-hidden animate-slide-in">
          {/* Header */}
          <div className="p-5 border-b border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-9 h-9 rounded-xl ${accentBgLight(accent)} flex items-center justify-center`}>
                <PackagePlus className={`w-4 h-4 ${accentText(accent)}`} />
              </div>
              <div>
                <h3 className="text-white font-bold text-sm">Mis Publicaciones</h3>
                <span className="text-[10px] text-slate-500">{myProducts.length} producto{myProducts.length !== 1 ? 's' : ''}</span>
              </div>
            </div>
            <button onClick={() => setIsPublishOpen(false)} className="text-slate-500 hover:text-white p-1.5 rounded-lg hover:bg-white/5 transition">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Add New Product Button */}
          <div className="px-5 pt-4">
            <button 
              onClick={() => setShowNewProductForm(!showNewProductForm)}
              className={`w-full py-3 rounded-xl border-2 border-dashed transition-all text-xs font-bold flex items-center justify-center gap-2 ${
                showNewProductForm 
                  ? 'border-red-500/30 text-red-400 hover:bg-red-500/5' 
                  : `${accentBorder(accent)} ${accentText(accent)} hover:bg-white/[0.03]`
              }`}
            >
              {showNewProductForm ? (
                <><X className="w-4 h-4" /> Cancelar</>
              ) : (
                <><Plus className="w-4 h-4" /> Publicar Nuevo Producto</>
              )}
            </button>
          </div>

          {/* New Product Form */}
          {showNewProductForm && (
            <div className="px-5 pt-4 space-y-3 animate-scale-in">
              <div className="bg-white/[0.02] border border-white/5 rounded-xl p-4 space-y-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
                    <Tag className="w-3 h-3 inline mr-1" />Nombre del producto
                  </label>
                  <input 
                    value={newProduct.name}
                    onChange={(e) => setNewProduct(p => ({ ...p, name: e.target.value }))}
                    placeholder="Ej: Collar de piedras naturales"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white outline-none focus:border-white/20 transition placeholder-slate-600 font-medium"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
                      <DollarSign className="w-3 h-3 inline mr-1" />Precio
                    </label>
                    <input 
                      value={newProduct.price}
                      onChange={(e) => setNewProduct(p => ({ ...p, price: e.target.value }))}
                      placeholder="0.00"
                      type="number"
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white outline-none focus:border-white/20 transition placeholder-slate-600 font-medium"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Tipo</label>
                    <button 
                      onClick={() => setNewProduct(p => ({ ...p, isDigital: !p.isDigital }))}
                      className={`w-full py-2.5 rounded-xl border text-[10px] font-bold transition-all ${
                        newProduct.isDigital 
                          ? `${accentBgLight(accent)} ${accentBorder(accent)} ${accentText(accent)}` 
                          : 'bg-white/5 border-white/10 text-slate-400'
                      }`}
                    >
                      {newProduct.isDigital ? '⚡ Digital' : '📦 Físico'}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
                    <FileText className="w-3 h-3 inline mr-1" />Descripción
                  </label>
                  <textarea 
                    value={newProduct.description}
                    onChange={(e) => setNewProduct(p => ({ ...p, description: e.target.value }))}
                    placeholder="Describe tu producto..."
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white outline-none focus:border-white/20 transition placeholder-slate-600 font-medium resize-none h-16"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
                    <ImageIcon className="w-3 h-3 inline mr-1" />Imagen del producto
                  </label>
                  <div className="flex gap-3 items-center">
                    <label className="cursor-pointer flex-1 py-2.5 rounded-xl border text-[10px] font-bold text-center transition-all bg-white/5 border-white/10 text-slate-300 hover:bg-white/10 hover:border-white/20">
                      <span>{newProduct.image ? '✓ Imagen Cargada' : '📁 Seleccionar Imagen'}</span>
                      <input 
                        type="file" 
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onloadend = () => {
                              setNewProduct(p => ({ ...p, image: reader.result as string }));
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                        className="hidden" 
                      />
                    </label>
                    {newProduct.image && (
                      <div className="relative w-10 h-10 rounded-lg overflow-hidden border border-white/10 bg-slate-950 flex-shrink-0">
                        <img src={newProduct.image} className="w-full h-full object-cover" />
                        <button 
                          onClick={(e) => {
                            e.preventDefault();
                            setNewProduct(p => ({ ...p, image: '' }));
                          }}
                          className="absolute inset-0 bg-black/60 opacity-0 hover:opacity-100 transition flex items-center justify-center text-white"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
                <button 
                  onClick={handlePublishProduct}
                  disabled={!newProduct.name || !newProduct.price}
                  className={`w-full ${accentBg(accent)} disabled:opacity-30 text-slate-950 font-bold py-2.5 rounded-xl text-xs transition flex items-center justify-center gap-2`}
                >
                  <Zap className="w-3.5 h-3.5" />
                  Publicar Producto
                </button>
              </div>
            </div>
          )}

          {/* My Products List */}
          <div className="flex-1 overflow-y-auto p-5 space-y-3">
            {myProducts.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center text-slate-500 gap-2">
                <Package className="w-8 h-8 opacity-30" />
                <span className="text-xs">No tienes productos publicados</span>
              </div>
            ) : (
              myProducts.map(product => (
                <div key={product.id} className="bg-white/[0.02] border border-white/5 p-3.5 rounded-xl flex gap-3 items-start group hover:bg-white/[0.03] transition">
                  <img src={product.image} className="w-14 h-14 rounded-lg object-cover bg-slate-900 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div>
                        <h5 className="text-[11px] font-bold text-white truncate">{product.name}</h5>
                        <span className={`text-[12px] font-extrabold ${accentText(accent)} block mt-0.5`}>${product.price.toFixed(2)}</span>
                      </div>
                      <button 
                        onClick={() => handleDeleteMyProduct(product.id)}
                        className="p-1.5 text-slate-600 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <div className="flex items-center gap-3 mt-2">
                      <span className="text-[9px] text-slate-500 flex items-center gap-1">
                        <Eye className="w-3 h-3" />{product.views || 0} vistas
                      </span>
                      <span className="text-[9px] text-slate-500 flex items-center gap-1">
                        <BarChart3 className="w-3 h-3" />{product.sales || 0} ventas
                      </span>
                      {product.isDigital && (
                        <span className={`text-[8px] font-black ${accentBg(accent)} text-slate-950 px-1.5 py-0.5 rounded`}>DIGITAL</span>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ======== SELLER CATALOG PANEL ======== */}
      {isSellerPanelOpen && selectedSeller && (
        <div className="absolute inset-y-4 right-4 w-[400px] glass-panel rounded-2xl z-20 flex flex-col overflow-hidden animate-slide-in">
          {/* Header */}
          <div className="p-5 border-b border-white/5 flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <img src={selectedSeller.avatarUrl || 'https://via.placeholder.com/100'} className="w-12 h-12 rounded-xl border border-white/10 object-cover" />
                <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 rounded-full border-2 border-[#090C16]" />
              </div>
              <div>
                <h3 className="text-white font-bold text-sm flex items-center gap-1.5">
                  {selectedSeller.name}
                  {selectedSeller.verified && <CheckCircle className={`w-3.5 h-3.5 ${accentText(accent)}`} />}
                </h3>
                <span className="text-[10px] text-slate-400 capitalize px-2 py-0.5 rounded-lg bg-white/5 inline-block mt-1 font-semibold">
                  {selectedSeller.userType === 'creador_digital' ? 'creador digital' : selectedSeller.userType}
                </span>
              </div>
            </div>
            <button onClick={() => setIsSellerPanelOpen(false)} className="text-slate-500 hover:text-white p-1.5 rounded-lg hover:bg-white/5 transition">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Details */}
          <div className="flex-1 overflow-y-auto p-5 space-y-5">
            <div className="flex items-center gap-3 text-xs border-b border-white/5 pb-4">
              <div className="flex items-center gap-1.5 bg-white/[0.03] px-3 py-1.5 rounded-lg border border-white/5">
                <Star className="text-amber-400 w-3.5 h-3.5 fill-current" />
                <span className="font-bold text-white">{selectedSeller.reputation}</span>
                <span className="text-slate-500 text-[10px]">(42)</span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-400 bg-white/[0.03] px-3 py-1.5 rounded-lg border border-white/5">
                <MapPin className={`w-3.5 h-3.5 ${accentText(accent)}`} />
                <span>{selectedSeller.distanceMeters}m</span>
              </div>
            </div>

            {/* Artisan Story */}
            {selectedSeller.userType === 'artesano' && selectedSeller.story && (
              <div className="bg-purple-500/5 border border-purple-500/15 p-4 rounded-xl">
                <span className="text-[9px] text-purple-400 font-extrabold tracking-wider uppercase flex items-center gap-1">
                  <Award className="w-3.5 h-3.5" /> Historia Handmade
                </span>
                <p className="text-xs text-slate-300 mt-1.5 leading-relaxed italic">"{selectedSeller.story}"</p>
                <div className="grid grid-cols-3 gap-1.5 mt-3">
                  <div className="aspect-square bg-slate-900 rounded-lg overflow-hidden">
                    <img src="https://images.unsplash.com/photo-1565192647048-f997ded87958?auto=format&fit=crop&w=100&q=80" className="object-cover w-full h-full" />
                  </div>
                  <div className="aspect-square bg-slate-900 rounded-lg overflow-hidden">
                    <img src="https://images.unsplash.com/photo-1595435934249-5df7ed86e1c0?auto=format&fit=crop&w=100&q=80" className="object-cover w-full h-full" />
                  </div>
                  <div className="aspect-square bg-slate-900 rounded-lg overflow-hidden">
                    <img src="https://images.unsplash.com/photo-1576016770956-debb63d90029?auto=format&fit=crop&w=100&q=80" className="object-cover w-full h-full" />
                  </div>
                </div>
              </div>
            )}

            {/* Digital Creator Stats */}
            {selectedSeller.userType === 'creador_digital' && (
              <div className="bg-cyan-500/5 border border-cyan-500/15 p-4 rounded-xl">
                <span className="text-[9px] text-cyan-400 font-extrabold tracking-wider uppercase flex items-center gap-1">
                  <Music className="w-3.5 h-3.5" /> Estadísticas & Licencia Digital
                </span>
                <div className="grid grid-cols-2 gap-3 mt-2 text-center text-xs">
                  <div className="bg-white/[0.03] p-2.5 rounded-lg border border-white/5">
                    <div className="text-slate-500 text-[9px] uppercase font-bold">Descargas</div>
                    <div className="text-white font-extrabold text-sm mt-0.5">14,204</div>
                  </div>
                  <div className="bg-white/[0.03] p-2.5 rounded-lg border border-white/5">
                    <div className="text-slate-500 text-[9px] uppercase font-bold">Reputación</div>
                    <div className="text-cyan-400 font-extrabold text-sm mt-0.5">Top Producer</div>
                  </div>
                </div>
              </div>
            )}

            {/* Product Catalog */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Catálogo</h4>
                <span className={`text-[10px] ${accentText(accent)} font-bold`}>{selectedSeller.products.length} artículos</span>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                {selectedSeller.products.map((product) => {
                  const itemsInCart = cart.find(i => i.product.id === product.id)?.quantity || 0;
                  const isPlaying = playingProductId === product.id;
                  const progress = audioProgress[product.id] || 0;

                  return (
                    <div key={product.id} className="bg-white/[0.02] border border-white/5 rounded-xl p-3 flex flex-col gap-2 relative transition-all duration-200 hover:border-white/10 hover:bg-white/[0.03] group">
                      <div className="aspect-square bg-slate-950 rounded-lg overflow-hidden relative">
                        <img src={product.image} className="w-full h-full object-cover transition duration-300 group-hover:scale-105" />
                        {product.isDigital && (
                          <span className={`absolute top-1.5 right-1.5 ${accentBg(accent)} text-slate-950 text-[8px] font-black px-1.5 py-0.5 rounded-md shadow`}>Digital</span>
                        )}
                        {itemsInCart > 0 && (
                          <span className={`absolute bottom-1.5 right-1.5 ${accentBg(accent)} text-slate-950 text-[9px] font-black w-5 h-5 rounded-full flex items-center justify-center shadow`}>
                            {itemsInCart}
                          </span>
                        )}
                        {product.isDigital && (
                          <button 
                            onClick={() => handleTogglePlay(product.id)}
                            className={`absolute inset-0 m-auto w-10 h-10 ${accentBg(accent)} hover:opacity-90 text-slate-950 rounded-full flex items-center justify-center shadow-lg transition-transform duration-200 hover:scale-110 active:scale-95`}
                          >
                            {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 fill-current ml-0.5" />}
                          </button>
                        )}
                      </div>

                      {product.isDigital && isPlaying && (
                        <div className="w-full bg-white/5 rounded-full h-1 overflow-hidden">
                          <div className={`${accentBg(accent)} h-full transition-all duration-300`} style={{ width: `${progress}%` }} />
                        </div>
                      )}

                      <div className="text-[11px] font-bold text-white leading-tight min-h-[30px] line-clamp-2">{product.name}</div>
                      <div className="text-[10px] text-slate-500 line-clamp-1 leading-none">{product.description}</div>
                      <div className="flex justify-between items-center mt-auto pt-1.5 border-t border-white/5">
                        <span className={`text-xs font-black ${accentText(accent)}`}>${product.price.toFixed(2)}</span>
                        <button 
                          onClick={() => handleAddToCart(product, selectedSeller)}
                          className={`${accentBgLight(accent)} border ${accentBorder(accent)} ${accentHoverBg(accent)} hover:text-slate-950 ${accentText(accent)} rounded-lg px-2 py-1 text-[10px] font-bold transition-all`}
                        >
                          Añadir
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-white/5 flex gap-2">
            <button 
              onClick={() => { setIsSellerPanelOpen(false); setIsCartOpen(true); }}
              className={`flex-1 ${accentBg(accent)} hover:opacity-90 text-slate-950 font-black py-3 rounded-xl transition flex items-center justify-center gap-2 text-xs shadow-lg ${accentShadow(accent)}`}
            >
              <ShoppingCart className="w-4 h-4" /> Ver Carrito
            </button>
            <button 
              onClick={() => {
                setChatOpen(selectedSeller);
                setChatMessages(prev => ({
                  ...prev,
                  [selectedSeller.userId]: prev[selectedSeller.userId] || [
                    { sender: 'seller' as const, text: `¡Hola! Soy ${selectedSeller.name}. ¿En qué te puedo ayudar hoy?`, time: 'Ahora' }
                  ]
                }));
              }}
              className="bg-white/5 hover:bg-white/10 text-white p-3 rounded-xl transition flex items-center justify-center border border-white/10"
              title="Abrir Chat"
            >
              <MessageSquare className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ======== CART PANEL ======== */}
      {isCartOpen && (
        <div className="absolute inset-y-4 right-4 w-[400px] glass-panel rounded-2xl z-20 flex flex-col overflow-hidden animate-slide-in">
          <div className="p-5 border-b border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-9 h-9 rounded-xl ${accentBgLight(accent)} flex items-center justify-center`}>
                <ShoppingCart className={`w-4 h-4 ${accentText(accent)}`} />
              </div>
              <h3 className="text-white font-bold text-sm">Carrito de Compra</h3>
            </div>
            <button onClick={() => setIsCartOpen(false)} className="text-slate-500 hover:text-white p-1.5 rounded-lg hover:bg-white/5 transition">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-5 space-y-3">
            {checkoutStatus === 'success' ? (
              <div className="flex flex-col items-center justify-center h-full text-center gap-4 animate-scale-in">
                <div className={`w-14 h-14 ${accentBgLight(accent)} rounded-2xl flex items-center justify-center border ${accentBorder(accent)}`}>
                  <Check className={`${accentText(accent)} w-7 h-7`} />
                </div>
                <h4 className="text-white font-bold text-lg">¡Pedido enviado!</h4>
                <p className="text-xs text-slate-400 max-w-[240px] leading-relaxed">
                  Se ha creado una conversación automática con cada vendedor para coordinar la entrega.
                </p>
              </div>
            ) : cart.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center text-slate-500 gap-3">
                <ShoppingCart className="w-10 h-10 opacity-20" />
                <span className="text-xs">El carrito está vacío</span>
                <span className="text-[10px] text-slate-600">Explora el mapa y añade productos</span>
              </div>
            ) : (
              cart.map((item) => (
                <div key={item.product.id} className="flex gap-3 bg-white/[0.02] border border-white/5 p-3.5 rounded-xl items-center group hover:bg-white/[0.03] transition">
                  <img src={item.product.image} className="w-12 h-12 rounded-lg object-cover bg-slate-900 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <h5 className="text-[11px] font-bold text-white truncate">{item.product.name}</h5>
                    <span className="text-[9px] text-slate-500 block truncate">Vendedor: {item.sellerName}</span>
                    <span className={`text-[11px] font-extrabold ${accentText(accent)} block mt-0.5`}>${(item.product.price * item.quantity).toFixed(2)}</span>
                  </div>
                  <div className="flex items-center gap-1.5 bg-white/5 border border-white/5 rounded-lg p-1">
                    <button onClick={() => handleUpdateCartQuantity(item.product.id, -1)} className="p-1 hover:text-white text-slate-500">
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="text-[10px] font-bold px-1 text-white">{item.quantity}</span>
                    <button onClick={() => handleUpdateCartQuantity(item.product.id, 1)} className="p-1 hover:text-white text-slate-500">
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                  <button onClick={() => handleRemoveFromCart(item.product.id)} className="p-1.5 text-slate-600 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>

          {cart.length > 0 && checkoutStatus !== 'success' && (
            <div className="p-4 border-t border-white/5 space-y-3">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400 font-medium">Subtotal:</span>
                <span className={`text-sm font-black ${accentText(accent)}`}>${cartTotal.toFixed(2)}</span>
              </div>
              <button 
                onClick={handleCheckout}
                disabled={checkoutStatus === 'loading'}
                className={`w-full ${accentBg(accent)} hover:opacity-90 disabled:opacity-30 text-slate-950 font-black py-3 rounded-xl transition flex items-center justify-center gap-2 text-xs shadow-lg ${accentShadow(accent)}`}
              >
                {checkoutStatus === 'loading' ? 'Procesando...' : <><Package className="w-4 h-4" /> Confirmar Compra</>}
              </button>
            </div>
          )}
        </div>
      )}

      {/* ======== SELLER DASHBOARD ======== */}
      {isSellerDashboardOpen && (
        <div className="absolute inset-y-4 right-4 w-[400px] glass-panel rounded-2xl z-20 flex flex-col overflow-hidden animate-slide-in">
          <div className="p-5 border-b border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-9 h-9 rounded-xl ${accentBgLight(accent)} flex items-center justify-center`}>
                <SlidersHorizontal className={`w-4 h-4 ${accentText(accent)}`} />
              </div>
              <h3 className="text-white font-bold text-sm">Panel de Vendedor</h3>
            </div>
            <button onClick={() => setIsSellerDashboardOpen(false)} className="text-slate-500 hover:text-white p-1.5 rounded-lg hover:bg-white/5 transition">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-white/5 pb-3">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Pedidos Recibidos</span>
              <span className={`text-[10px] ${accentText(accent)} font-bold ${accentBgLight(accent)} border ${accentBorder(accent)} px-2 py-0.5 rounded-full`}>
                {sellerOrders.length} pedidos
              </span>
            </div>

            {sellerOrders.length === 0 ? (
              <div className="text-center text-slate-500 text-xs py-8">No hay pedidos recibidos</div>
            ) : (
              sellerOrders.map((order) => (
                <div key={order.id} className="bg-white/[0.02] border border-white/5 p-4 rounded-xl space-y-3 hover:bg-white/[0.03] transition">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[10px] text-slate-500 font-bold">Pedido #{order.id}</span>
                      <h4 className="text-[11px] font-bold text-white mt-0.5">{order.itemName}</h4>
                      <span className="text-[9px] text-slate-400 block mt-0.5">Comprador: {order.buyerName}</span>
                    </div>
                    <span className={`text-[11px] font-black ${accentText(accent)}`}>${order.price.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center justify-between pt-2.5 border-t border-white/5">
                    <span className="text-[9px] text-slate-500">{order.time}</span>
                    {order.status === 'pending' && (
                      <button 
                        onClick={() => handleUpdateOrderStatus(order.id, 'preparing')}
                        className={`${accentBgLight(accent)} border ${accentBorder(accent)} ${accentHoverBg(accent)} hover:text-slate-950 ${accentText(accent)} text-[10px] px-2.5 py-1 rounded-lg font-bold transition-all`}
                      >
                        Aceptar y Preparar
                      </button>
                    )}
                    {order.status === 'preparing' && (
                      <button 
                        onClick={() => handleUpdateOrderStatus(order.id, 'ready')}
                        className="bg-emerald-500/10 border border-emerald-500/30 hover:bg-emerald-500 hover:text-slate-950 text-emerald-400 text-[10px] px-2.5 py-1 rounded-lg font-bold transition-all"
                      >
                        Listo para Entrega
                      </button>
                    )}
                    {order.status === 'ready' && (
                      <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/5 border border-emerald-500/20 px-2 py-0.5 rounded-lg flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" /> Listo
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ======== CHAT WIDGET ======== */}
      {chatOpen && (
        <div className="absolute bottom-6 right-4 w-80 h-[420px] glass-panel rounded-2xl z-30 flex flex-col overflow-hidden animate-scale-in">
          {/* Chat Header */}
          <div className="p-3.5 border-b border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="relative">
                <img src={chatOpen.avatarUrl || 'https://via.placeholder.com/100'} className="w-8 h-8 rounded-lg object-cover" />
                <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-[#090C16]" />
              </div>
              <div>
                <h4 className="text-[11px] font-bold text-white">{chatOpen.name}</h4>
                <span className="text-[8px] text-emerald-400 font-bold">En línea</span>
              </div>
            </div>
            <button onClick={() => setChatOpen(null)} className="text-slate-500 hover:text-white p-1.5 rounded-lg hover:bg-white/5 transition">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-2.5 flex flex-col">
            {(chatMessages[chatOpen.userId] || []).map((msg, index) => (
              <div 
                key={index} 
                className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed flex flex-col ${
                  msg.sender === 'system'
                    ? 'bg-white/5 text-slate-300 border border-white/5 mx-auto max-w-[90%] text-center rounded-xl'
                    : msg.sender === 'buyer'
                    ? `${accentBg(accent)} text-slate-950 rounded-br-sm ml-auto font-medium shadow-md`
                    : 'bg-white/5 text-slate-200 border border-white/5 rounded-bl-sm mr-auto'
                }`}
              >
                <span className="whitespace-pre-line">{msg.text}</span>
                <span className={`text-[8px] mt-1 text-right block ${
                  msg.sender === 'system' ? 'text-slate-500' : msg.sender === 'buyer' ? 'text-slate-800' : 'text-slate-500'
                }`}>
                  {msg.time}
                </span>
              </div>
            ))}

            {isSellerTyping && (
              <div className="bg-white/5 text-slate-400 border border-white/5 rounded-2xl rounded-bl-sm px-3.5 py-2.5 text-xs mr-auto flex items-center gap-1.5 max-w-[60%]">
                <span className="flex gap-1">
                  <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </span>
              </div>
            )}
          </div>

          {/* Input */}
          <form onSubmit={handleSendMessage} className="p-3 border-t border-white/5 flex gap-2">
            <input 
              type="text" 
              placeholder="Escribe tu mensaje..." 
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              className="flex-1 bg-white/5 border border-white/5 rounded-xl px-3 py-2.5 text-[11px] outline-none text-white focus:border-white/15 font-medium placeholder-slate-600 transition"
            />
            <button 
              type="submit"
              className={`${accentBg(accent)} hover:opacity-90 text-slate-950 p-2.5 rounded-xl transition flex items-center justify-center shadow ${accentShadow(accent)}`}
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
