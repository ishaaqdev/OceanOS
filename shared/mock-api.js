// ═══════════════════════════════════════════════════════
// OceanOS Shared Interceptor — Mock API & WebSockets & settings
// ═══════════════════════════════════════════════════════

(function () {
  // Determine if we should run in mock mode
  const STORAGE_KEY_API = 'oceanos_custom_api_url';
  const STORAGE_KEY_MODE = 'oceanos_demo_mode';
  
  let customApiUrl = localStorage.getItem(STORAGE_KEY_API) || '';
  let forceDemoMode = localStorage.getItem(STORAGE_KEY_MODE) !== 'false'; // Default to true

  // If custom API is set, we can attempt to use it
  let useMockMode = forceDemoMode || !customApiUrl;

  console.log(`[OceanOS Interceptor] Initialize. Mode: ${useMockMode ? 'Mock/Offline Demo' : 'Live Custom URL (' + customApiUrl + ')'}`);

  // Broadcast channel for tabs to talk (simulation -> dashboard)
  const channel = new BroadcastChannel('oceanos_telemetry');

  // ═══════════════════════════════════════════════════════
  // LOCAL MOCK DATABASE SETUP
  // ═══════════════════════════════════════════════════════
  const DB_KEY = 'oceanos_in_memory_db';
  let db = null;

  function loadDb() {
    const raw = localStorage.getItem(DB_KEY);
    if (raw) {
      try {
        db = JSON.parse(raw);
        return;
      } catch (e) {
        console.error('Error parsing mock DB, resetting', e);
      }
    }
    resetDb();
  }

  function saveDb() {
    if (db) {
      localStorage.setItem(DB_KEY, JSON.stringify(db));
    }
  }

  function resetDb() {
    db = {
      stats: [
        { metric: 'plastic_recovered_tonnes', value: 847.3, unit: 'tonnes' },
        { metric: 'marine_lives_saved', value: 15420, unit: 'animals' },
        { metric: 'co2_emissions_prevented', value: 2340, unit: 'tonnes' },
        { metric: 'ocean_area_cleaned', value: 12500, unit: 'sq_km' },
        { metric: 'illegal_boats_intercepted', value: 234, unit: 'vessels' },
        { metric: 'oil_spills_contained', value: 18, unit: 'incidents' },
        { metric: 'coral_reefs_protected', value: 45, unit: 'reefs' },
        { metric: 'fishing_nets_recycled', value: 3200, unit: 'nets' },
        { metric: 'species_monitored', value: 156, unit: 'species' },
        { metric: 'drones_deployed', value: 12, unit: 'units' }
      ],
      notifications: [
        { id: 1, title: 'Illegal Vessel Detected', message: 'Commercial trawler detected in MPA Zone B at 14.52N, 65.08W', type: 'danger', source: 'drone', read: 0, timestamp: new Date(Date.now() - 3600000).toISOString() },
        { id: 2, title: 'Oil Spill Alert', message: 'Minor oil leak detected near Industrial Zone - Buoy #7 triggered', type: 'warning', source: 'buoy', read: 0, timestamp: new Date(Date.now() - 7200000).toISOString() },
        { id: 3, title: 'Net Capacity Warning', message: 'River collection net at 85% capacity - Schedule maintenance', type: 'warning', source: 'river', read: 0, timestamp: new Date(Date.now() - 10800000).toISOString() },
        { id: 4, title: 'Plastic Patch Located', message: 'Large debris field spotted at 14.48N 65.35W - ~450kg estimated', type: 'info', source: 'drone', read: 0, timestamp: new Date(Date.now() - 14400000).toISOString() }
      ],
      fishermanCredits: [
        { id: 1, fisherman_id: 'F001', fisherman_name: 'Ahmed Hassan', credits: 1250, nets_returned: 15, plastic_kg: 45.5 },
        { id: 2, fisherman_id: 'F002', fisherman_name: 'Ravi Kumar', credits: 890, nets_returned: 10, plastic_kg: 32.0 },
        { id: 3, fisherman_id: 'F003', fisherman_name: 'Carlos Silva', credits: 2100, nets_returned: 25, plastic_kg: 78.3 },
        { id: 4, fisherman_id: 'F004', fisherman_name: 'Yuki Tanaka', credits: 560, nets_returned: 7, plastic_kg: 21.2 },
        { id: 5, fisherman_id: 'F005', fisherman_name: 'Omar Ali', credits: 1780, nets_returned: 20, plastic_kg: 65.0 }
      ],
      fishingZones: [
        { id: 1, name: 'Coral Reef Shallows', lat: 14.55, lng: -65.20, radius: 8, type: 'excellent', fish_density: 0.92, is_restricted: 0, reason: null },
        { id: 2, name: 'Deep Trench Point', lat: 14.48, lng: -65.35, radius: 6, type: 'good', fish_density: 0.75, is_restricted: 0, reason: null },
        { id: 3, name: 'Mangrove Bay', lat: 14.60, lng: -65.15, radius: 5, type: 'excellent', fish_density: 0.88, is_restricted: 0, reason: null },
        { id: 4, name: 'Open Sea Zone A', lat: 14.40, lng: -65.50, radius: 12, type: 'moderate', fish_density: 0.55, is_restricted: 0, reason: null },
        { id: 5, name: 'Turtle Nesting Area', lat: 14.52, lng: -65.08, radius: 10, type: 'restricted', fish_density: 0.30, is_restricted: 1, reason: 'Marine Protected Area - Sea Turtle Nesting' },
        { id: 6, name: 'Whale Migration Path', lat: 14.35, lng: -65.40, radius: 15, type: 'restricted', fish_density: 0.20, is_restricted: 1, reason: 'Seasonal Whale Migration Route' }
      ],
      illegalBoats: [
        { id: 1, vessel_name: 'Shadow Fisher', vessel_type: 'Trawler', lat: 14.52, lng: -65.09, speed_knots: 6.2, in_mpa: 1, status: 'active', first_detected: new Date(Date.now() - 3600000).toISOString(), last_seen: new Date().toISOString() },
        { id: 2, vessel_name: 'Night Hawk', vessel_type: 'Drift Netter', lat: 14.53, lng: -65.10, speed_knots: 4.8, in_mpa: 1, status: 'active', first_detected: new Date(Date.now() - 7200000).toISOString(), last_seen: new Date().toISOString() },
        { id: 3, vessel_name: 'Sea Ghost', vessel_type: 'Long Liner', lat: 14.38, lng: -65.42, speed_knots: 8.1, in_mpa: 0, status: 'monitoring', first_detected: new Date(Date.now() - 14400000).toISOString(), last_seen: new Date().toISOString() }
      ],
      plasticCollections: [],
      riverCollections: [],
      detections: [],
      pollutionEvents: []
    };

    // Prepopulate some plastic data
    const sources = ['ocean_cleanup', 'river_net', 'beach_patrol', 'drone_guided'];
    const types = ['bottle', 'bag', 'container', 'fishing_net', 'fragment', 'styrofoam'];
    for (let i = 0; i < 50; i++) {
      db.plasticCollections.push({
        id: i + 1,
        source: sources[Math.floor(Math.random() * sources.length)],
        type: types[Math.floor(Math.random() * types.length)],
        weight_kg: +(Math.random() * 5 + 0.1).toFixed(2),
        count: Math.floor(Math.random() * 20 + 1),
        timestamp: new Date(Date.now() - Math.random() * 5 * 24 * 3600 * 1000).toISOString(),
        location_x: (Math.random() - 0.5) * 600,
        location_y: (Math.random() - 0.5) * 600
      });
    }
    saveDb();
  }

  loadDb();

  // ═══════════════════════════════════════════════════════
  // INTERCEPT FETCH
  // ═══════════════════════════════════════════════════════
  const originalFetch = window.fetch;

  window.fetch = async function (resource, options) {
    const backendPort = window.OceanOS_Backend_Port || 3001;
    const backendUrlStr = `localhost:${backendPort}/api`;

    if (!useMockMode) {
      // If we have a custom URL and it is a relative API call or points to localhost, rewrite it
      if (typeof resource === 'string' && (resource.includes('localhost:3001/api') || resource.includes(backendUrlStr) || resource.startsWith('/api') || resource.endsWith('/api') || resource.includes('/api/'))) {
        let cleanUrl = resource;
        if (resource.includes('localhost:3001/api')) {
          cleanUrl = resource.replace('http://localhost:3001/api', customApiUrl);
        } else if (resource.includes(backendUrlStr)) {
          cleanUrl = resource.replace(`http://localhost:${backendPort}/api`, customApiUrl);
        } else if (resource.startsWith('/api')) {
          cleanUrl = customApiUrl + resource.substring(4);
        }
        return originalFetch(cleanUrl, options);
      }
      return originalFetch(resource, options);
    }

    if (typeof resource === 'string') {
      const url = resource;
      
      // Check if this is an API request we need to mock
      if (url.includes('/api/stats/overview')) {
        const plasticTotal = db.plasticCollections.reduce((sum, item) => sum + item.weight_kg, 0);
        const activePollution = db.notifications.filter(n => n.type === 'danger' && n.source === 'buoy' && !n.read).length;
        const illegalBoats = db.illegalBoats.filter(b => b.status === 'active').length;
        const unreadNotifications = db.notifications.filter(n => !n.read).length;

        return mockResponse({
          stats: db.stats,
          plasticTotal,
          detectionCount: db.detections.length + 15,
          illegalBoats,
          activePollution,
          unreadNotifications
        });
      }

      if (url.includes('/api/plastic')) {
        if (options && options.method === 'POST') {
          const body = JSON.parse(options.body);
          const newRecord = {
            id: db.plasticCollections.length + 1,
            source: body.source || 'unknown',
            type: body.type || 'mixed',
            weight_kg: +(body.weight_kg || 0).toFixed(2),
            count: body.count || 1,
            timestamp: new Date().toISOString(),
            location_x: body.location_x,
            location_y: body.location_y
          };
          db.plasticCollections.unshift(newRecord);
          
          // Increment totals in stats
          const stat = db.stats.find(s => s.metric === 'plastic_recovered_tonnes');
          if (stat) {
            stat.value += (newRecord.weight_kg / 1000);
          }
          saveDb();

          // Broadcast real-time message
          channel.postMessage({ type: 'plastic_collected', data: newRecord });

          return mockResponse({ id: newRecord.id });
        }

        // GET request
        // Aggregate by source
        const bySourceMap = {};
        const byTypeMap = {};
        db.plasticCollections.forEach(p => {
          bySourceMap[p.source] = (bySourceMap[p.source] || 0) + p.weight_kg;
          byTypeMap[p.type] = (byTypeMap[p.type] || 0) + p.count;
        });

        const bySource = Object.keys(bySourceMap).map(src => ({ source: src, total: bySourceMap[src], items: db.plasticCollections.filter(p => p.source === src).reduce((s, x) => s + x.count, 0) }));
        const byType = Object.keys(byTypeMap).map(type => ({ type: type, total: db.plasticCollections.filter(p => p.type === type).reduce((s, x) => s + x.weight_kg, 0), items: byTypeMap[type] }));

        return mockResponse({
          data: db.plasticCollections.slice(0, 100),
          bySource,
          byType
        });
      }

      if (url.includes('/api/river')) {
        if (options && options.method === 'POST') {
          const body = JSON.parse(options.body);
          const newRecord = {
            id: db.riverCollections.length + 1,
            plastic_type: body.plastic_type || 'mixed',
            weight_kg: +(body.weight_kg || 0).toFixed(2),
            fill_level: body.fill_level || 0,
            flow_speed: body.flow_speed || 2.0,
            timestamp: new Date().toISOString()
          };
          db.riverCollections.unshift(newRecord);

          // Update fill level alert if needed
          if (newRecord.fill_level > 85) {
            addNotification('River net alert', `River Net is at ${Math.round(newRecord.fill_level)}% capacity. Maintenance is recommended.`, 'warning', 'river');
          }

          saveDb();
          channel.postMessage({ type: 'river_collection', data: newRecord });
          return mockResponse({ success: true });
        }

        const totalKg = db.riverCollections.reduce((sum, item) => sum + item.weight_kg, 0);
        return mockResponse({
          data: db.riverCollections,
          totalKg
        });
      }

      if (url.includes('/api/notifications')) {
        if (url.includes('/read')) {
          // Read individual notification
          const id = parseInt(url.split('/notifications/')[1].split('/read')[0]);
          const notif = db.notifications.find(n => n.id === id);
          if (notif) {
            notif.read = 1;
            saveDb();
          }
          return mockResponse({ success: true });
        }
        if (url.includes('/read-all')) {
          db.notifications.forEach(n => n.read = 1);
          saveDb();
          return mockResponse({ success: true });
        }
        return mockResponse(db.notifications);
      }

      if (url.includes('/api/detections')) {
        if (options && options.method === 'POST') {
          const body = JSON.parse(options.body);
          const newRec = {
            id: db.detections.length + 1,
            type: body.type,
            name: body.name,
            confidence: body.confidence || 0.95,
            lat: body.lat,
            lng: body.lng,
            timestamp: new Date().toISOString(),
            is_illegal: body.is_illegal || 0,
            in_mpa: body.in_mpa || 0,
            resolved: 0
          };
          db.detections.unshift(newRec);

          if (body.is_illegal) {
            addNotification('Illegal Activity', `${body.name || 'Vessel'} detected operating in MPA zone.`, 'danger', 'drone');
          }

          saveDb();
          channel.postMessage({ type: 'detection', data: newRec });
          return mockResponse({ id: newRec.id });
        }
        return mockResponse(db.detections);
      }

      if (url.includes('/api/pollution')) {
        if (options && options.method === 'POST') {
          const body = JSON.parse(options.body);
          const newRec = {
            id: db.pollutionEvents.length + 1,
            type: body.type,
            severity: body.severity || 'LOW',
            pollution_level: body.pollution_level || 0,
            oil_ppm: body.oil_ppm || 0,
            location: body.location,
            timestamp: new Date().toISOString(),
            resolved: 0
          };
          db.pollutionEvents.unshift(newRec);

          if (body.severity === 'HIGH' || body.severity === 'CRITICAL') {
            addNotification('Pollution Alert', `Critical pollution levels detected at ${body.location}`, 'danger', 'buoy');
          }

          saveDb();
          channel.postMessage({ type: 'pollution', data: newRec });
          return mockResponse({ id: newRec.id });
        }

        // Return combined mock pollution records
        return mockResponse(db.pollutionEvents.concat([
          { id: 99, type: 'Oil Slick', severity: 'CRITICAL', pollution_level: 85, oil_ppm: 340, location: 'Industrial Outflow Point', timestamp: new Date(Date.now() - 3600000 * 2).toISOString(), resolved: 0 },
          { id: 98, type: 'Microplastics', severity: 'HIGH', pollution_level: 60, oil_ppm: 0, location: 'Coral Reef Shallows', timestamp: new Date(Date.now() - 3600000 * 6).toISOString(), resolved: 0 }
        ]));
      }

      if (url.includes('/api/fishing-zones')) {
        return mockResponse(db.fishingZones);
      }

      if (url.includes('/api/fisherman/credits')) {
        return mockResponse(db.fishermanCredits);
      }

      if (url.includes('/api/fisherman/return-net')) {
        const body = JSON.parse(options.body);
        const fisherman_id = body.fisherman_id;
        const fisherman_name = body.fisherman_name || 'Anonymous';
        const plastic_kg = parseFloat(body.plastic_kg || 0);
        const credits = Math.floor(plastic_kg * 25);

        let fisher = db.fishermanCredits.find(f => f.fisherman_id === fisherman_id);
        if (fisher) {
          fisher.credits += credits;
          fisher.nets_returned += 1;
          fisher.plastic_kg += plastic_kg;
        } else {
          fisher = {
            id: db.fishermanCredits.length + 1,
            fisherman_id,
            fisherman_name,
            credits,
            nets_returned: 1,
            plastic_kg
          };
          db.fishermanCredits.push(fisher);
        }

        addNotification('Net Returned', `${fisherman_name} returned nets (+${credits} credits)`, 'info', 'fisherman');
        
        // Add to global plastic metrics
        const stat = db.stats.find(s => s.metric === 'fishing_nets_recycled');
        if (stat) stat.value += 1;

        saveDb();
        return mockResponse({ credits_earned: credits, total: fisher.credits });
      }

      if (url.includes('/api/illegal-boats')) {
        return mockResponse(db.illegalBoats);
      }

      if (url.includes('/api/gemini/analyze')) {
        return new Promise((resolve) => {
          setTimeout(() => {
            resolve(mockResponse({
              is_debris: true,
              confidence: 0.94,
              debris_type: 'Plastic bottles and net fragments',
              estimated_weight_kg: 8.4,
              environmental_risk: 'HIGH',
              description: 'AI model indicates floating debris, primarily consisting of high-density polyethylene bottles and discarded fishing net elements.',
              recommended_action: 'Alert cleanup boat and monitor drift pattern via drone surveillance.'
            }));
          }, 1500); // realistic AI delay
        });
      }

      if (url.includes('/api/gemini/chat')) {
        const body = JSON.parse(options.body);
        const msg = (body.message || '').toLowerCase();
        let reply = "I'm the OceanOS AI assistant. I can help you monitor marine health, understand local guidelines, or explain plastic filtration.";

        if (msg.includes('spot') || msg.includes('fish') || msg.includes('where')) {
          reply = "The best sustainable spots today based on sensor data are Coral Reef Shallows (safe depth, calm currents) and Seagrass Meadow. Avoid the Industrial Outflow Zone and Turtle Nesting Protected Area (restricted).";
        } else if (msg.includes('credits') || msg.includes('earn') || msg.includes('recycle')) {
          reply = "You earn credits by returning derelict nets and plastic waste. Every kg of waste returns 25 credits. Accumulating credits unlocks higher rank tiers like Ocean Guardian.";
        } else if (msg.includes('spill') || msg.includes('pollution') || msg.includes('oil')) {
          reply = "To contain oil spills, deploy containment booms around the leakage source immediately, then trigger suction pumps from the recovery vessel. Buoy alert logs will display live ppm contamination.";
        } else if (msg.includes('hi') || msg.includes('hello')) {
          reply = "Hello captain! How can I assist you with your maritime operations today?";
        }

        return new Promise((resolve) => {
          setTimeout(() => {
            resolve(mockResponse({ reply }));
          }, 800);
        });
      }
    }

    return originalFetch(resource, options);
  };

  function mockResponse(data) {
    return {
      ok: true,
      status: 200,
      json: async () => data,
      text: async () => JSON.stringify(data),
      headers: new Headers({ 'Content-Type': 'application/json' })
    };
  }

  function addNotification(title, message, type, source) {
    const newNotif = {
      id: db.notifications.length + 1,
      title,
      message,
      type,
      source,
      read: 0,
      timestamp: new Date().toISOString()
    };
    db.notifications.unshift(newNotif);
    saveDb();
    channel.postMessage({ type: 'notification', data: newNotif });
  }

  // ═══════════════════════════════════════════════════════
  // INTERCEPT WEBSOCKETS
  // ═══════════════════════════════════════════════════════
  if (useMockMode) {
    const OriginalWebSocket = window.WebSocket;

    window.WebSocket = function (url) {
      console.log(`[OceanOS Interceptor] Intercepting WebSocket connection to: ${url}`);
      
      const self = {
        readyState: 0, // CONNECTING
        onopen: null,
        onmessage: null,
        onclose: null,
        onerror: null,
        send: function (data) {
          console.log('[OceanOS Interceptor] Mock WS Send:', data);
        },
        close: function () {
          clearInterval(this.interval);
          channel.removeEventListener('message', this.channelListener);
          if (this.onclose) this.onclose();
        }
      };

      // Set open
      setTimeout(() => {
        self.readyState = 1; // OPEN
        if (self.onopen) self.onopen();

        // Send initial stats
        if (self.onmessage) {
          self.onmessage({
            data: JSON.stringify({
              type: 'init',
              data: { stats: db.stats }
            })
          });
        }
      }, 200);

      // Start periodic sensor simulation updates (mocking backend/server.js loop)
      self.interval = setInterval(() => {
        if (self.readyState === 1 && self.onmessage) {
          self.onmessage({
            data: JSON.stringify({
              type: 'sim_update',
              data: {
                ocean_cleanup: {
                  plastic_collected_session: +(Math.random() * 2).toFixed(2),
                  debris_in_boom: Math.floor(Math.random() * 30),
                  wind_speed: +(10 + Math.random() * 10).toFixed(1),
                  wave_height: +(0.5 + Math.random() * 2).toFixed(1)
                },
                drone: {
                  altitude: Math.floor(80 + Math.random() * 60),
                  battery: Math.floor(82 + Math.random() * 16),
                  targets_detected: Math.floor(Math.random() * 5)
                },
                pollution: {
                  pollution_level: +(Math.random() * 20).toFixed(1),
                  oil_ppm: Math.floor(Math.random() * 80),
                  water_quality: Math.random() > 0.85 ? 'POOR' : 'GOOD'
                },
                river: {
                  fill_level: +(Math.random() * 100).toFixed(1),
                  flow_speed: +(1.5 + Math.random() * 2).toFixed(1),
                  collected_count: Math.floor(Math.random() * 10)
                }
              }
            })
          });
        }
      }, 5000);

      // Listen to the BroadcastChannel to relay events from other tabs
      self.channelListener = function(event) {
        if (self.readyState === 1 && self.onmessage) {
          self.onmessage({ data: JSON.stringify(event.data) });
        }
      };
      channel.addEventListener('message', self.channelListener);

      return self;
    };

    // Keep static codes
    window.WebSocket.CONNECTING = OriginalWebSocket.CONNECTING;
    window.WebSocket.OPEN = OriginalWebSocket.OPEN;
    window.WebSocket.CLOSING = OriginalWebSocket.CLOSING;
    window.WebSocket.CLOSED = OriginalWebSocket.CLOSED;
  }

  // ═══════════════════════════════════════════════════════
  // FLOATING DEMO SETTINGS WIDGET
  // ═══════════════════════════════════════════════════════
  document.addEventListener('DOMContentLoaded', () => {
    // Avoid widget on the landing page if not needed, but keep it available everywhere
    const widget = document.createElement('div');
    widget.id = 'oceanos-demo-widget';
    widget.style.cssText = `
      position: fixed;
      bottom: 16px;
      right: 16px;
      z-index: 10000;
      background: rgba(7, 13, 26, 0.95);
      border: 1px solid #1a2840;
      border-radius: 8px;
      padding: 10px;
      color: #e8f4ff;
      font-family: 'Inter', system-ui, -apple-system, sans-serif;
      font-size: 11px;
      box-shadow: 0 4px 24px rgba(0,0,0,0.5);
      backdrop-filter: blur(8px);
      width: 220px;
      transition: all 0.3s ease;
    `;

    const widgetHeader = document.createElement('div');
    widgetHeader.style.cssText = 'display:flex; justify-content:space-between; align-items:center; cursor:pointer; font-weight:600;';
    widgetHeader.innerHTML = `
      <span style="display:flex; align-items:center; gap:6px;">
        <span style="width:6px; height:6px; border-radius:50%; background:${useMockMode ? '#0af5c8' : '#3b82f6'}; box-shadow:0 0 6px ${useMockMode ? '#0af5c8' : '#3b82f6'};"></span>
        OceanOS Demo Core
      </span>
      <span id="widget-toggle" style="font-size:9px; color:#7a9bb8;">[MINIMIZE]</span>
    `;

    const widgetContent = document.createElement('div');
    widgetContent.id = 'widget-content';
    widgetContent.style.cssText = 'margin-top:10px; display:flex; flex-direction:column; gap:8px; border-top:1px solid #1a2840; padding-top:8px;';
    widgetContent.innerHTML = `
      <div>
        <label style="display:flex; align-items:center; gap:6px; color:#7a9bb8; cursor:pointer;">
          <input type="checkbox" id="chk-demo-mode" ${useMockMode ? 'checked' : ''} />
          Active Client-Side Demo
        </label>
      </div>
      <div id="api-url-input-container" style="display:${useMockMode ? 'none' : 'block'}">
        <div style="color:#7a9bb8; margin-bottom:4px;">Custom Backend API URL:</div>
        <input type="text" id="txt-api-url" value="${customApiUrl}" placeholder="e.g. http://127.0.0.1:3001/api" style="width:100%; background:#0d1525; border:1px solid #1a2840; color:#fff; border-radius:4px; padding:4px 6px; font-size:10px;" />
      </div>
      <button id="btn-save-settings" style="background:#00c8ff; color:#000; border:none; padding:5px; border-radius:4px; font-weight:600; cursor:pointer; font-size:10px; margin-top:2px;">
        Apply Settings
      </button>
    `;

    widget.appendChild(widgetHeader);
    widget.appendChild(widgetContent);
    document.body.appendChild(widget);

    // Minimize toggle
    let minimized = false;
    widgetHeader.addEventListener('click', (e) => {
      if (e.target.id === 'chk-demo-mode') return;
      minimized = !minimized;
      widgetContent.style.display = minimized ? 'none' : 'flex';
      if (!minimized && document.getElementById('chk-demo-mode').checked) {
        document.getElementById('api-url-input-container').style.display = 'none';
      }
      document.getElementById('widget-toggle').textContent = minimized ? '[EXPAND]' : '[MINIMIZE]';
    });

    const chkDemoMode = document.getElementById('chk-demo-mode');
    const apiContainer = document.getElementById('api-url-input-container');
    chkDemoMode.addEventListener('change', () => {
      apiContainer.style.display = chkDemoMode.checked ? 'none' : 'block';
    });

    document.getElementById('btn-save-settings').addEventListener('click', () => {
      const isDemo = chkDemoMode.checked;
      const apiUrlVal = document.getElementById('txt-api-url').value.trim();

      localStorage.setItem(STORAGE_KEY_MODE, isDemo ? 'true' : 'false');
      if (!isDemo && apiUrlVal) {
        localStorage.setItem(STORAGE_KEY_API, apiUrlVal);
      } else if (isDemo) {
        localStorage.removeItem(STORAGE_KEY_API);
      }

      // Reload window to apply interceptors
      window.location.reload();
    });
  });

})();
