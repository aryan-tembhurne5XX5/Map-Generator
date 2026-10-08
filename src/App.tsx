/**
 * App.tsx — Main application component.
 * Connects the Sidebar (input) with the LandMap (SVG output).
 * Manages project state and handles export/save/load operations.
 */
import React, { useState, useCallback, useRef, useMemo, useEffect } from 'react';
import { Map, ZoomIn, ZoomOut, Maximize2, RotateCcw, Edit3 } from 'lucide-react';
import type { LandProject } from '@/types/land';
import { createDefaultProject } from '@/data/defaultProject';
import { computePolygon } from '@/geometry/polygon';
import { exportAsPng, exportAsSvg, exportAsPdf, saveProjectAsJson, loadProjectFromJson } from '@/utils/export';
import Sidebar from '@/components/layout/Sidebar';
import LandMap from '@/components/map/LandMap';

const App: React.FC = () => {
  const [project, setProject] = useState<LandProject>(() => createDefaultProject());
  const [zoom, setZoom] = useState(1);
  const [editingName, setEditingName] = useState(false);
  const mapRef = useRef<HTMLDivElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);

  // Compute area for display
  const calculatedArea = useMemo(() => {
    const polygon = computePolygon(project.boundaries, project.geometry);
    return polygon.area;
  }, [project.boundaries, project.geometry]);

  // Project update handler (merges partial updates)
  const handleUpdate = useCallback((updates: Partial<LandProject>) => {
    setProject(prev => ({ ...prev, ...updates }));
  }, []);

  // Export handlers
  const handleExportPng = useCallback(async () => {
    const el = mapRef.current?.querySelector('.map-svg-wrapper') as HTMLElement;
    if (el) {
      try {
        await exportAsPng(el, `${project.name.replace(/\s+/g, '_')}.png`);
      } catch (err) {
        console.error('PNG export failed:', err);
      }
    }
  }, [project.name]);

  const handleExportSvg = useCallback(async () => {
    const el = mapRef.current?.querySelector('.map-svg-wrapper') as HTMLElement;
    if (el) {
      try {
        await exportAsSvg(el, `${project.name.replace(/\s+/g, '_')}.svg`);
      } catch (err) {
        console.error('SVG export failed:', err);
      }
    }
  }, [project.name]);

  const handleExportPdf = useCallback(async () => {
    const el = mapRef.current?.querySelector('.map-svg-wrapper') as HTMLElement;
    if (el) {
      try {
        await exportAsPdf(el, `${project.name.replace(/\s+/g, '_')}.pdf`, 'landscape');
      } catch (err) {
        console.error('PDF export failed:', err);
      }
    }
  }, [project.name]);

  const handleSave = useCallback(() => {
    saveProjectAsJson(project, `${project.name.replace(/\s+/g, '_')}.json`);
  }, [project]);

  const handleLoad = useCallback(async () => {
    try {
      const data = await loadProjectFromJson();
      if (data && typeof data === 'object') {
        setProject(data as LandProject);
      }
    } catch (err) {
      console.error('Failed to load project:', err);
    }
  }, []);

  // Zoom handlers
  const handleZoomIn = () => setZoom(z => Math.min(z + 0.15, 3));
  const handleZoomOut = () => setZoom(z => Math.max(z - 0.15, 0.3));
  const handleZoomReset = () => setZoom(1);
  const handleFit = () => setZoom(1);

  // Scroll wheel zoom on viewport
  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;
    const handler = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        const delta = e.deltaY > 0 ? -0.08 : 0.08;
        setZoom(z => Math.min(3, Math.max(0.3, z + delta)));
      }
    };
    viewport.addEventListener('wheel', handler, { passive: false });
    return () => viewport.removeEventListener('wheel', handler);
  }, []);

  // Focus name input when editing
  useEffect(() => {
    if (editingName && nameInputRef.current) {
      nameInputRef.current.focus();
      nameInputRef.current.select();
    }
  }, [editingName]);

  const lang = project.language;

  return (
    <div className="app-layout">
      {/* ══════ HEADER ══════ */}
      <header className="app-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div className="header-icon">
            <Map size={20} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {editingName ? (
                <input
                  ref={nameInputRef}
                  className="header-name-input"
                  value={project.name}
                  onChange={e => handleUpdate({ name: e.target.value })}
                  onBlur={() => setEditingName(false)}
                  onKeyDown={e => { if (e.key === 'Enter') setEditingName(false); }}
                />
              ) : (
                <h1 onClick={() => setEditingName(true)} style={{ cursor: 'pointer' }}>
                  {lang === 'hi' || lang === 'both' ? 'जमीन का नक्शा जनरेटर' : 'Land Map Generator'}
                  {lang === 'both' && <span style={{ fontWeight: 400, fontSize: '0.9rem' }}> / Land Map Generator</span>}
                  <Edit3 size={12} style={{ marginLeft: 6, opacity: 0.5 }} />
                </h1>
              )}
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {/* Geometry status */}
          {(() => {
            const polygon = computePolygon(project.boundaries, project.geometry);
            const statusClass = polygon.status === 'reliable' ? 'reliable' : polygon.status === 'approximate' ? 'approximate' : 'invalid';
            const statusText = polygon.status === 'reliable'
              ? (lang === 'hi' || lang === 'both' ? 'विश्वसनीय' : 'Reliable')
              : polygon.status === 'approximate'
                ? (lang === 'hi' || lang === 'both' ? 'अनुमानित' : 'Approximate')
                : (lang === 'hi' || lang === 'both' ? 'अमान्य' : 'Invalid');
            return (
              <div className={`status-badge ${statusClass}`}>
                <div className="status-dot" />
                {lang === 'hi' || lang === 'both' ? 'ज्यामिति' : 'Geometry'}: {statusText}
              </div>
            );
          })()}
        </div>
      </header>

      {/* ══════ BODY ══════ */}
      <div className="app-body">
        {/* Sidebar */}
        <Sidebar
          project={project}
          calculatedArea={calculatedArea}
          onUpdate={handleUpdate}
          onExportPng={handleExportPng}
          onExportSvg={handleExportSvg}
          onExportPdf={handleExportPdf}
          onSave={handleSave}
          onLoad={handleLoad}
        />

        {/* Map Preview */}
        <div className="map-preview-container" ref={mapRef}>
          {/* Toolbar */}
          <div className="map-toolbar">
            <div className="map-toolbar-group">
              <button
                className={`btn btn-sm ${project.editMode !== 'presentation' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => handleUpdate({ editMode: 'free' })}
              >
                <Edit3 size={14} style={{ marginRight: 6 }} />
                {lang === 'hi' || lang === 'both' ? 'नक्शा एडिट करें' : 'Edit Map'}
              </button>
              <button
                className={`btn btn-sm ${project.editMode === 'presentation' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => handleUpdate({ editMode: 'presentation' })}
              >
                <Map size={14} style={{ marginRight: 6 }} />
                {lang === 'hi' || lang === 'both' ? 'पूर्वावलोकन' : 'Preview'}
              </button>

              <div style={{ width: 1, height: 24, background: '#e2e8f0', margin: '0 8px' }} />

              <span style={{ fontSize: '0.65rem', color: '#94a3b8' }}>
                Ctrl+Scroll to zoom
              </span>
            </div>
            <div className="map-toolbar-group">
              <button className="btn btn-icon btn-secondary" onClick={handleZoomIn} title="Zoom In" aria-label="Zoom In">
                <ZoomIn size={16} />
              </button>
              <button className="btn btn-icon btn-secondary" onClick={handleZoomOut} title="Zoom Out" aria-label="Zoom Out">
                <ZoomOut size={16} />
              </button>
              <button className="btn btn-icon btn-secondary" onClick={handleZoomReset} title="Reset Zoom" aria-label="Reset Zoom">
                <RotateCcw size={16} />
              </button>
              <button className="btn btn-icon btn-secondary" onClick={handleFit} title="Fit to Screen" aria-label="Fit to Screen">
                <Maximize2 size={16} />
              </button>
              <span style={{ fontSize: '0.7rem', color: '#94a3b8', marginLeft: 4, fontWeight: 600 }}>
                {Math.round(zoom * 100)}%
              </span>
            </div>
          </div>

          {/* Map Viewport */}
          <div className="map-viewport" ref={viewportRef} style={{ overflow: 'auto' }}>
            <div
              className="map-svg-wrapper"
              style={{
                transform: `scale(${zoom})`,
                transformOrigin: 'center center',
                transition: 'transform 0.15s ease',
              }}
            >
              <LandMap project={project} onUpdate={handleUpdate} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
