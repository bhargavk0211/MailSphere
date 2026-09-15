import { Routes, Route, useNavigate, useLocation } from "react-router-dom";
import { makeStyles, tokens, Tab, TabList } from "@fluentui/react-components";
import {
  HomeRegular,
  GridRegular,
  StarRegular,
  SearchRegular,
  HomeFilled,
  GridFilled,
  StarFilled,
  SearchFilled,
} from "@fluentui/react-icons";
import Dashboard from "./pages/Dashboard";
import CategoryView from "./pages/CategoryView";
import ListingDetailPage from "./pages/ListingDetailPage";
import FeaturedPage from "./pages/FeaturedPage";
import SmartSearchPage from "./pages/SmartSearchPage";

const useStyles = makeStyles({
  root: {
    display: "flex",
    flexDirection: "column",
    minHeight: "100vh",
    backgroundColor: "#f0f4f8",
  },
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "18px 40px",
    background:
      "linear-gradient(135deg, #0f172a 0%, #1e3a5f 50%, #1e40af 100%)",
    color: "#ffffff",
    position: "relative" as const,
    overflow: "hidden",
  },
  headerGlow: {
    position: "absolute" as const,
    top: "-60%",
    right: "-5%",
    width: "500px",
    height: "500px",
    background:
      "radial-gradient(circle, rgba(99,102,241,0.2) 0%, transparent 70%)",
    borderRadius: "50%",
    pointerEvents: "none" as const,
  },
  headerGlow2: {
    position: "absolute" as const,
    bottom: "-80%",
    left: "10%",
    width: "300px",
    height: "300px",
    background:
      "radial-gradient(circle, rgba(56,189,248,0.15) 0%, transparent 70%)",
    borderRadius: "50%",
    pointerEvents: "none" as const,
  },
  headerLeft: {
    display: "flex",
    alignItems: "center",
    gap: "16px",
    zIndex: 1,
  },
  logoIcon: {
    width: "46px",
    height: "46px",
    background:
      "linear-gradient(135deg, #38bdf8 0%, #6366f1 50%, #a855f7 100%)",
    borderRadius: "14px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "24px",
    boxShadow: "0 8px 24px rgba(99,102,241,0.35)",
    border: "2px solid rgba(255,255,255,0.15)",
  },
  logoText: {
    display: "flex",
    flexDirection: "column",
    gap: "1px",
  },
  logoTitle: {
    fontSize: "22px",
    fontWeight: 800,
    letterSpacing: "-0.6px",
    lineHeight: 1.2,
    background: "linear-gradient(90deg, #ffffff 0%, #e0e7ff 100%)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
  },
  logoSubtitle: {
    fontSize: "12px",
    opacity: 0.6,
    fontWeight: 400,
    letterSpacing: "0.8px",
    textTransform: "uppercase" as const,
  },
  headerRight: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    zIndex: 1,
  },
  aiBadge: {
    background:
      "linear-gradient(135deg, rgba(129,140,248,0.9), rgba(192,132,252,0.9))",
    backdropFilter: "blur(8px)",
    color: "#fff",
    padding: "6px 14px",
    borderRadius: "24px",
    fontSize: "11px",
    fontWeight: 600,
    letterSpacing: "0.5px",
    display: "flex",
    alignItems: "center",
    gap: "6px",
    border: "1px solid rgba(255,255,255,0.2)",
    boxShadow: "0 4px 12px rgba(129,140,248,0.3)",
  },
  liveBadge: {
    background:
      "linear-gradient(135deg, rgba(34,197,94,0.9), rgba(16,185,129,0.9))",
    color: "#fff",
    padding: "6px 14px",
    borderRadius: "24px",
    fontSize: "11px",
    fontWeight: 600,
    letterSpacing: "0.3px",
    display: "flex",
    alignItems: "center",
    gap: "6px",
    border: "1px solid rgba(255,255,255,0.2)",
  },
  liveDot: {
    width: "6px",
    height: "6px",
    borderRadius: "50%",
    backgroundColor: "#fff",
    animation: "pulse 2s ease-in-out infinite",
  },
  nav: {
    backgroundColor: "rgba(255,255,255,0.95)",
    backdropFilter: "blur(12px)",
    padding: "0 40px",
    borderBottom: "1px solid rgba(0,0,0,0.06)",
    position: "sticky" as const,
    top: "0",
    zIndex: 100,
    boxShadow: "0 4px 16px rgba(0,0,0,0.03)",
  },
  content: {
    flex: 1,
    padding: "36px 40px",
    maxWidth: "1440px",
    width: "100%",
    margin: "0 auto",
    boxSizing: "border-box" as const,
  },
  footer: {
    padding: "20px 40px",
    textAlign: "center" as const,
    fontSize: "13px",
    color: "#64748b",
    borderTop: "1px solid #e2e8f0",
    backgroundColor: "#ffffff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
  },
});

const NAV_ITEMS = [
  {
    path: "/",
    label: "Dashboard",
    icon: <HomeRegular />,
    activeIcon: <HomeFilled />,
  },
  {
    path: "/categories",
    label: "Browse",
    icon: <GridRegular />,
    activeIcon: <GridFilled />,
  },
  {
    path: "/featured",
    label: "Featured",
    icon: <StarRegular />,
    activeIcon: <StarFilled />,
  },
  {
    path: "/search",
    label: "Smart Search",
    icon: <SearchRegular />,
    activeIcon: <SearchFilled />,
  },
];

export default function App() {
  const styles = useStyles();
  const navigate = useNavigate();
  const location = useLocation();

  const currentTab =
    NAV_ITEMS.find(
      (n) => n.path !== "/" && location.pathname.startsWith(n.path),
    )?.path ?? "/";

  return (
    <div className={styles.root}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerGlow} />
        <div className={styles.headerGlow2} />
        <div className={styles.headerLeft}>
          <div className={styles.logoIcon}>🏪</div>
          <div className={styles.logoText}>
            <span className={styles.logoTitle}>Microsoft Marketplace</span>
            <span className={styles.logoSubtitle}>
              Community Commerce Platform
            </span>
          </div>
        </div>
        <div className={styles.headerRight}>
          <div className={styles.liveBadge}>
            <div className={styles.liveDot} /> Live
          </div>
          <div className={styles.aiBadge}>✨ AI-Powered</div>
        </div>
      </div>

      {/* Navigation */}
      <div className={styles.nav}>
        <TabList
          selectedValue={currentTab}
          onTabSelect={(_, data) => navigate(data.value as string)}
          size="large"
        >
          {NAV_ITEMS.map((item) => (
            <Tab
              key={item.path}
              value={item.path}
              icon={currentTab === item.path ? item.activeIcon : item.icon}
            >
              {item.label}
            </Tab>
          ))}
        </TabList>
      </div>

      {/* Content */}
      <div className={styles.content}>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/categories" element={<CategoryView />} />
          <Route path="/categories/:categoryId" element={<CategoryView />} />
          <Route path="/featured" element={<FeaturedPage />} />
          <Route path="/search" element={<SmartSearchPage />} />
          <Route path="/listing/:listingId" element={<ListingDetailPage />} />
        </Routes>
      </div>

      {/* Footer */}
      <div className={styles.footer}>
        <span>Built with 💜 for Microsoft Hackathon 2026</span>
        <span style={{ opacity: 0.4 }}>•</span>
        <span>React + Fluent UI + FastAPI + Azure OpenAI</span>
      </div>
    </div>
  );
}
