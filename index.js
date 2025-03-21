import { ready } from 'https://lsong.org/scripts/dom.js';
import { h, render, useState, useEffect } from 'https://lsong.org/scripts/react/index.js';

const AppIcon = ({ app }) => {
  const [hasError, setHasError] = useState(false);
  const [iconIndex, setIconIndex] = useState(0);
  
  // 定义多个可能的图标源
  const iconSources = [
    // App-Fair/appcasks 仓库图标 (基于您提供的格式)
    `https://github.com/App-Fair/appcasks/releases/download/cask-${app.token}/AppIcon.png`,
    // 原有的 caskroom 图标源
    `https://cdn.jsdelivr.net/gh/caskroom/homebrew-cask@master/Casks/${app.token}.rb/icon.png`,
    // 其他可能的图标源可以继续添加
  ];
  
  const fallbackIcon = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="%23ddd"><rect width="100" height="100" rx="20" /><path d="M30,30 L70,70 M30,70 L70,30" stroke="%23aaa" stroke-width="5"/></svg>';

  const handleImageError = () => {
    // 尝试下一个图标源
    if (iconIndex < iconSources.length - 1) {
      setIconIndex(iconIndex + 1);
    } else {
      // 如果所有源都失败，使用占位图标
      setHasError(true);
    }
  };

  return h('img', {
    className: 'app-icon',
    src: hasError ? fallbackIcon : iconSources[iconIndex],
    alt: `${app.name} icon`,
    onError: handleImageError
  });
};

const AppDetail = ({ app, onBack }) => {
  if (!app) return null;
  
  return [
    h('div', { className: 'app-detail' }, [
      h('button', { className: 'back-button', onClick: onBack }, '← Back to Apps'),
      h('div', { className: 'app-detail-header' }, [
        h('div', { className: 'app-icon-large' }, [
          AppIcon({ app })
        ]),
        h('div', { className: 'app-detail-title' }, [
          h('h2', null, app.name),
          h('p', { className: 'app-version-detail' }, app.version || 'Unknown version'),
          h('p', { className: 'app-description-text' }, app.desc || 'No description available'),
          h('p', null, [h('strong', null, 'Homepage: '), h('a', { href: app.homepage, target: '_blank' }, app.homepage)])
        ]),
        h('div', { className: 'app-actions' }, [
          app.url ? h('a', { 
            className: 'download-button', 
            href: app.url, 
            target: '_blank' 
          }, 'Download') : null
        ])
      ]),
      app.caveats ? h('div', { className: 'app-caveats-section' }, [
        h('h3', null, 'Caveats'),
        h('pre', { className: 'app-caveats' }, app.caveats)
      ]) : null
    ])
  ];
};

const AppCard = ({ app, onClick }) => {
  return h('div', { 
    className: 'app-card', 
    onClick: () => onClick(app) 
  }, [
    h('div', { className: 'app-icon-wrapper' }, [
      AppIcon({ app })
    ]),
    h('h3', { className: 'app-card-title' }, app.name),
    h('p', { className: 'app-version' }, app.version || '')
  ]);
};

const App = () => {
  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedApp, setSelectedApp] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [sortDirection, setSortDirection] = useState('asc');

  useEffect(() => {
    const fetchApps = async () => {
      try {
        setLoading(true);
        const response = await fetch('https://formulae.brew.sh/api/cask.json');
        if (!response.ok) throw new Error('Failed to fetch apps');
        
        const data = await response.json();
        // Process data to extract relevant info
        const processedData = data.map(app => ({
          name: app.name || app.token,
          token: app.token,
          desc: app.desc,
          version: app.version,
          homepage: app.homepage,
          url: app.url,
          artifacts: app.artifacts,
          caveats: app.caveats
        }));
        setApps(processedData);
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };
    
    fetchApps();
  }, []);

  const handleSelectApp = (app) => {
    setSelectedApp(app);
    // Scroll to top when viewing app detail
    window.scrollTo(0, 0);
  };

  const handleBack = () => {
    setSelectedApp(null);
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortDirection('asc');
    }
  };

  const filteredApps = apps.filter(app => 
    String(app.name || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const sortedApps = [...filteredApps].sort((a, b) => {
    // Handle null values
    if (!a[sortBy]) return 1;
    if (!b[sortBy]) return -1;
    
    // Sort string values
    if (typeof a[sortBy] === 'string') {
      const comparison = a[sortBy].localeCompare(b[sortBy]);
      return sortDirection === 'asc' ? comparison : -comparison;
    }
    
    // Sort numeric values
    const comparison = a[sortBy] - b[sortBy];
    return sortDirection === 'asc' ? comparison : -comparison;
  });

  if (selectedApp) {
    return AppDetail({ app: selectedApp, onBack: handleBack });
  }

  return [
    h('h2', { className: 'app-store-heading' }, "App Store"),
    h('div', { className: 'app-store-controls' }, [
      h('input', {
        type: 'search',
        placeholder: 'Search apps...',
        value: searchTerm,
        onInput: handleSearch,
        className: 'search-input'
      }),
      h('div', { className: 'sort-controls' }, [
        h('span', null, 'Sort by: '),
        h('button', { 
          className: `sort-button ${sortBy === 'name' ? 'active' : ''}`,
          onClick: () => handleSort('name') 
        }, `Name ${sortBy === 'name' ? (sortDirection === 'asc' ? '↑' : '↓') : ''}`),
        h('button', { 
          className: `sort-button ${sortBy === 'version' ? 'active' : ''}`,
          onClick: () => handleSort('version')
        }, `Version ${sortBy === 'version' ? (sortDirection === 'asc' ? '↑' : '↓') : ''}`)
      ])
    ]),
    loading ? h('div', { className: 'loading' }, "Loading apps...") : null,
    error ? h('p', { className: 'error' }, `Error: ${error}`) : null,
    (!loading && !error) ? [
      h('div', { className: 'results-info' }, `${filteredApps.length} apps found`),
      h('div', { className: 'app-grid' }, 
        sortedApps.map(app => AppCard({ app, onClick: handleSelectApp }))
      )
    ] : null,
    (!loading && !error && sortedApps.length === 0) ? 
      h('p', { className: 'no-results' }, "No apps found matching your search.") : null
  ];
};

ready(() => {
  const app = document.getElementById('app');
  render(h(App), app);
});