import { useState, useEffect } from "react";
import axios from "axios";
import {
  LayoutDashboard,
  RefreshCw,
  FileText,
  CheckCircle2,
  Clock,
  Sparkles,
  ExternalLink,
  Bot,
} from "lucide-react";
import "./App.css";

function App() {
  const [articles, setArticles] = useState([]);
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  // Auto-Refresh Logic (Every 3 seconds)
  useEffect(() => {
    fetchArticles();
    const interval = setInterval(() => {
      axios
        .get(
          "https://beyondchats-content-intelligence-platform.onrender.com/api/articles"
        )
        .then((response) => {
          setArticles(response.data);
          setLastUpdated(new Date());
        })
        .catch((err) => console.error("Polling error", err));
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const fetchArticles = () => {
    setLoading(true);
    axios
      .get(
        "https://beyondchats-content-intelligence-platform.onrender.com/api/articles"
      )
      .then((response) => {
        setArticles(response.data);
        setLoading(false);
      })
      .catch((err) => setLoading(false));
  };

  // Sync selected article with latest data
  const currentSelected = selectedArticle
    ? articles.find((a) => a.id === selectedArticle.id) || selectedArticle
    : null;

  return (
    <div className="dashboard">
      {/* SIDEBAR */}
      <aside className="sidebar">
        <div className="brand">
          <Bot className="brand-icon" size={28} />
          <span>
            Content<span className="brand-highlight">AI</span>
          </span>
        </div>

        <div className="sidebar-header">
          <p className="subtitle">Your Library</p>
          <span className="badge">{articles.length}</span>
        </div>

        <div className="article-list">
          {loading ? (
            <div className="skeleton-loader">
              <div className="skeleton-line"></div>
              <div className="skeleton-line"></div>
              <div className="skeleton-line"></div>
            </div>
          ) : (
            articles.map((article) => (
              <div
                key={article.id}
                onClick={() => setSelectedArticle(article)}
                className={`nav-item ${
                  currentSelected?.id === article.id ? "active" : ""
                }`}
              >
                <div className="nav-item-icon">
                  {article.status === "completed" ? (
                    <CheckCircle2 size={18} className="text-green" />
                  ) : (
                    <Clock size={18} className="text-orange" />
                  )}
                </div>
                <div className="nav-item-content">
                  <span className="nav-title">{article.title}</span>
                  <span className="nav-date">ID: #{article.id}</span>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="sidebar-footer">
          <div className="status-indicator">
            <span className="dot pulse"></span>
            Live Syncing
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="main-content">
        <header className="top-bar">
          <div className="breadcrumbs">
            <LayoutDashboard size={18} />
            <span>/</span>
            <span>Dashboard</span>
            {currentSelected && (
              <>
                <span>/</span>
                <span className="current-crumb">Editor</span>
              </>
            )}
          </div>
          <button onClick={fetchArticles} className="refresh-btn">
            <RefreshCw size={16} /> Refresh
          </button>
        </header>

        <div className="content-area">
          {currentSelected ? (
            <div className="editor-layout">
              <div className="editor-header">
                <h1>{currentSelected.title}</h1>
                <a
                  href={currentSelected.link || "#"}
                  target="_blank"
                  rel="noreferrer"
                  className="external-link"
                >
                  View Source <ExternalLink size={14} />
                </a>
              </div>

              <div className="comparison-container">
                {/* ORIGINAL CARD */}
                <div className="card glass-panel">
                  <div className="card-header">
                    <FileText size={20} className="icon-grey" />
                    <h3>Original Content</h3>
                  </div>
                  <div className="card-body">
                    <div
                      dangerouslySetInnerHTML={{
                        __html: currentSelected.original_content,
                      }}
                    />
                  </div>
                </div>

                {/* AI ENHANCED CARD */}
                <div
                  className={`card glass-panel ${
                    currentSelected.status === "completed"
                      ? "accent-border"
                      : ""
                  }`}
                >
                  <div className="card-header">
                    <Sparkles size={20} className="icon-purple" />
                    <h3>
                      AI Enhanced
                      {currentSelected.status === "pending" && (
                        <span className="tag-pending">Processing...</span>
                      )}
                    </h3>
                  </div>
                  <div className="card-body">
                    {currentSelected.updated_content ? (
                      <div
                        className="fade-in"
                        dangerouslySetInnerHTML={{
                          __html: currentSelected.updated_content,
                        }}
                      />
                    ) : (
                      <div className="empty-state">
                        <div className="loader-ring"></div>
                        <p>AI Agent is writing...</p>
                        <span className="sub-text">
                          This usually takes 10-20 seconds
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="welcome-screen">
              <div className="welcome-box">
                <Bot size={64} className="welcome-icon" />
                <h2>Select an Article</h2>
                <p>
                  Choose an article from the sidebar to view the AI enhancement
                  analysis.
                </p>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default App;
