/**
 * Sidebar.tsx — Complete input panel with accordion sections
 * for land dimensions, orientation, divisions, elements, and surroundings.
 */
import React, { useState, useCallback } from 'react';
import {
  ChevronDown, Ruler, Compass, Grid3X3, MapPin, Navigation,
  Plus, Trash2, Download, Upload, Settings, Globe
} from 'lucide-react';
import type {
  LandProject, Unit, CardinalDirection, Language,
  ElementType, PositionPreset, SurroundingType, ElementDisplayMode,
  DivisionMethod,
} from '@/types/land';
import { t } from '@/i18n/translations';
import { formatNumber, areaUnitLabel, areaUnitLabelHi } from '@/geometry/units';
import { v4 as uuidv4 } from 'uuid';

interface SidebarProps {
  project: LandProject;
  calculatedArea: number;
  onUpdate: (updates: Partial<LandProject>) => void;
  onExportPng: () => void;
  onExportSvg: () => void;
  onExportPdf: () => void;
  onSave: () => void;
  onLoad: () => void;
}

// Accordion section wrapper
const Section: React.FC<{
  title: string;
  icon: React.ReactNode;
  defaultOpen?: boolean;
  children: React.ReactNode;
}> = ({ title, icon, defaultOpen = false, children }) => {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="sidebar-section">
      <div className="sidebar-section-header" onClick={() => setOpen(!open)}>
        <h3>{icon} {title}</h3>
        <ChevronDown size={16} className={`chevron ${open ? 'open' : ''}`} />
      </div>
      {open && <div className="sidebar-section-body fade-in">{children}</div>}
    </div>
  );
};

const Sidebar: React.FC<SidebarProps> = ({
  project, calculatedArea, onUpdate,
  onExportPng, onExportSvg, onExportPdf,
  onSave, onLoad,
}) => {
  const lang = project.language;
  
  // ── Helpers ──
  const updateBoundary = (dir: CardinalDirection, value: number) => {
    onUpdate({ boundaries: { ...project.boundaries, [dir]: value } });
  };

  const updateOrientation = (side: 'top' | 'right' | 'bottom' | 'left', value: CardinalDirection) => {
    onUpdate({ orientation: { ...project.orientation, [side]: value } });
  };

  const updateSurrounding = (dir: CardinalDirection, field: string, value: string) => {
    onUpdate({
      surroundings: {
        ...project.surroundings,
        [dir]: { ...project.surroundings[dir], [field]: value },
      },
    });
  };

  const addElement = () => {
    const newElem = {
      id: uuidv4(),
      type: 'temple' as ElementType,
      name: 'Temple',
      nameHi: 'मंदिर',
      position: 'north-east' as PositionPreset,
      offsetX: 5,
      offsetY: 4,
      width: 6,
      height: 6,
      rotation: 0,
      displayMode: 'icon-name' as ElementDisplayMode,
    };
    onUpdate({ elements: [...project.elements, newElem] });
  };

  const removeElement = (id: string) => {
    onUpdate({ elements: project.elements.filter(e => e.id !== id) });
  };

  const updateElement = (id: string, updates: Record<string, unknown>) => {
    onUpdate({
      elements: project.elements.map(e =>
        e.id === id ? { ...e, ...updates } : e
      ),
    });
  };

  // Area display
  const displayArea = project.declaredArea || calculatedArea;
  const aul = lang === 'hi' ? areaUnitLabelHi(project.unit) : areaUnitLabel(project.unit);

  const dirOptions: CardinalDirection[] = ['north', 'south', 'east', 'west'];
  const unitOptions: Unit[] = ['ft', 'm', 'yd'];
  const elementTypes: Array<{ value: ElementType; label: string; labelHi: string }> = [
    { value: 'temple', label: 'Temple', labelHi: 'मंदिर' },
    { value: 'house', label: 'House', labelHi: 'मकान' },
    { value: 'gate', label: 'Gate', labelHi: 'गेट' },
    { value: 'tree', label: 'Tree', labelHi: 'पेड़' },
    { value: 'garden', label: 'Garden', labelHi: 'बगीचा' },
    { value: 'well', label: 'Well', labelHi: 'कुआँ' },
    { value: 'parking', label: 'Parking', labelHi: 'पार्किंग' },
    { value: 'shop', label: 'Shop', labelHi: 'दुकान' },
    { value: 'water-tank', label: 'Water Tank', labelHi: 'पानी की टंकी' },
    { value: 'open-area', label: 'Open Area', labelHi: 'खुला क्षेत्र' },
  ];
  const positionOptions: Array<{ value: PositionPreset; label: string }> = [
    { value: 'north-east', label: 'North-East' },
    { value: 'north-west', label: 'North-West' },
    { value: 'south-east', label: 'South-East' },
    { value: 'south-west', label: 'South-West' },
    { value: 'center', label: 'Center' },
    { value: 'north', label: 'North' },
    { value: 'south', label: 'South' },
    { value: 'east', label: 'East' },
    { value: 'west', label: 'West' },
  ];

  return (
    <div className="sidebar">
      {/* ── Area Display ── */}
      <div style={{ padding: '16px 20px 8px' }}>
        <div className="area-display">
          <div className="area-label">
            {lang === 'hi' || lang === 'both' ? 'कुल क्षेत्रफल' : 'Total Area'}
          </div>
          <div className="area-value">{formatNumber(Math.round(displayArea))}</div>
          <div className="area-unit">{aul}</div>
        </div>

        {/* Language & Unit toggles */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 12, justifyContent: 'space-between' }}>
          <div className="toggle-group">
            {(['en', 'hi', 'both'] as Language[]).map(l => (
              <button key={l} className={`toggle-item ${project.language === l ? 'active' : ''}`}
                onClick={() => onUpdate({ language: l })}>
                {l === 'en' ? 'EN' : l === 'hi' ? 'हिं' : 'Both'}
              </button>
            ))}
          </div>
          <div className="toggle-group">
            {unitOptions.map(u => (
              <button key={u} className={`toggle-item ${project.unit === u ? 'active' : ''}`}
                onClick={() => onUpdate({ unit: u })}>
                {u}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ══════ LAND DIMENSIONS ══════ */}
      <Section title={lang === 'hi' || lang === 'both' ? 'जमीन का माप' : 'Land Dimensions'} icon={<Ruler size={14} />} defaultOpen>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">{lang === 'hi' || lang === 'both' ? 'उत्तर (North)' : 'North'}</label>
            <input type="number" className="form-input" value={project.boundaries.north || ''}
              placeholder="42" min={0}
              onChange={e => updateBoundary('north', parseFloat(e.target.value) || 0)} />
          </div>
          <div className="form-group">
            <label className="form-label">{lang === 'hi' || lang === 'both' ? 'पूर्व (East)' : 'East'}</label>
            <input type="number" className="form-input" value={project.boundaries.east || ''}
              placeholder="44" min={0}
              onChange={e => updateBoundary('east', parseFloat(e.target.value) || 0)} />
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">{lang === 'hi' || lang === 'both' ? 'दक्षिण (South)' : 'South'}</label>
            <input type="number" className="form-input" value={project.boundaries.south || ''}
              placeholder="20" min={0}
              onChange={e => updateBoundary('south', parseFloat(e.target.value) || 0)} />
          </div>
          <div className="form-group">
            <label className="form-label">{lang === 'hi' || lang === 'both' ? 'पश्चिम (West)' : 'West'}</label>
            <input type="number" className="form-input" value={project.boundaries.west || ''}
              placeholder="27" min={0}
              onChange={e => updateBoundary('west', parseFloat(e.target.value) || 0)} />
          </div>
        </div>
        <div className="form-group">
          <label className="form-label">{lang === 'hi' || lang === 'both' ? 'घोषित क्षेत्रफल (Declared Area)' : 'Declared Area'} ({aul})</label>
          <input type="number" className="form-input" value={project.declaredArea || ''}
            placeholder="1518" min={0}
            onChange={e => onUpdate({ declaredArea: parseFloat(e.target.value) || undefined })} />
        </div>
        {project.declaredArea && calculatedArea > 0 && (
          <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: 4 }}>
            {lang === 'hi' || lang === 'both' ? 'गणना क्षेत्रफल' : 'Calculated'}: {formatNumber(Math.round(calculatedArea))} {aul}
            {' '}({lang === 'hi' || lang === 'both' ? 'अंतर' : 'Diff'}: {((Math.abs(calculatedArea - project.declaredArea) / project.declaredArea) * 100).toFixed(1)}%)
          </div>
        )}
      </Section>

      {/* ══════ ORIENTATION ══════ */}
      <Section title={lang === 'hi' || lang === 'both' ? 'दिशा विन्यास' : 'Orientation'} icon={<Compass size={14} />}>
        {(['top', 'right', 'bottom', 'left'] as const).map(side => (
          <div className="form-group" key={side}>
            <label className="form-label">
              {side === 'top' ? (lang === 'hi' || lang === 'both' ? 'ऊपर' : 'Top') :
               side === 'right' ? (lang === 'hi' || lang === 'both' ? 'दायां' : 'Right') :
               side === 'bottom' ? (lang === 'hi' || lang === 'both' ? 'नीचे' : 'Bottom') :
               (lang === 'hi' || lang === 'both' ? 'बायां' : 'Left')}
            </label>
            <select className="form-select" value={project.orientation[side]}
              onChange={e => updateOrientation(side, e.target.value as CardinalDirection)}>
              {dirOptions.map(d => (
                <option key={d} value={d}>{d.charAt(0).toUpperCase() + d.slice(1)}</option>
              ))}
            </select>
          </div>
        ))}
      </Section>

      {/* ══════ DIVISIONS ══════ */}
      <Section title={lang === 'hi' || lang === 'both' ? 'बंटवारा' : 'Divisions'} icon={<Grid3X3 size={14} />}>
        <div className="form-group">
          <label className="checkbox-group">
            <input type="checkbox" checked={project.divisions.enabled}
              onChange={e => onUpdate({
                divisions: { ...project.divisions, enabled: e.target.checked }
              })} />
            <span className="checkbox-label">
              {lang === 'hi' || lang === 'both' ? 'बंटवारा सक्षम करें' : 'Enable Division'}
            </span>
          </label>
        </div>
        
        {project.divisions.enabled && (
          <>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">{lang === 'hi' || lang === 'both' ? 'हिस्से' : 'Parts'}</label>
                <select className="form-select" value={project.divisions.count}
                  onChange={e => {
                    const count = parseInt(e.target.value);
                    const divs = Array.from({ length: count }, (_, i) => ({
                      id: `div-${i + 1}`,
                      name: `Part ${i + 1}`,
                      nameHi: `हिस्सा ${i + 1}`,
                      percentage: 100 / count,
                      color: i === 0 ? 'rgba(76, 175, 80, 0.3)' :
                             i === 1 ? 'rgba(255, 235, 59, 0.3)' :
                             i === 2 ? 'rgba(33, 150, 243, 0.2)' :
                             'rgba(255, 152, 0, 0.2)',
                    }));
                    onUpdate({ divisions: { ...project.divisions, count, divisions: divs } });
                  }}>
                  {[2, 3, 4].map(n => <option key={n} value={n}>{n}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">{lang === 'hi' || lang === 'both' ? 'विधि' : 'Method'}</label>
                <select className="form-select" value={project.divisions.method}
                  onChange={e => onUpdate({
                    divisions: { ...project.divisions, method: e.target.value as DivisionMethod }
                  })}>
                  <option value="equal-area">{lang === 'hi' || lang === 'both' ? 'बराबर क्षेत्रफल' : 'Equal Area'}</option>
                  <option value="equal-width">{lang === 'hi' || lang === 'both' ? 'बराबर चौड़ाई' : 'Equal Width'}</option>
                </select>
              </div>
            </div>
          </>
        )}
      </Section>

      {/* ══════ ELEMENTS ══════ */}
      <Section title={lang === 'hi' || lang === 'both' ? 'तत्व' : 'Elements'} icon={<MapPin size={14} />}>
        {project.elements.map(elem => (
          <div key={elem.id} className="element-item" style={{ flexDirection: 'column', alignItems: 'stretch', gap: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: 600 }}>{elem.name} {elem.nameHi ? `/ ${elem.nameHi}` : ''}</span>
              <button className="btn btn-sm btn-secondary" onClick={() => removeElement(elem.id)}>
                <Trash2 size={12} />
              </button>
            </div>
            <div className="form-row">
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ fontSize: '0.65rem' }}>Type</label>
                <select className="form-select" value={elem.type} style={{ padding: '4px 8px', fontSize: '0.75rem' }}
                  onChange={e => {
                    const type = e.target.value as ElementType;
                    const found = elementTypes.find(et => et.value === type);
                    updateElement(elem.id, {
                      type,
                      name: found?.label || type,
                      nameHi: found?.labelHi || '',
                    });
                  }}>
                  {elementTypes.map(et => (
                    <option key={et.value} value={et.value}>{et.label}</option>
                  ))}
                </select>
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ fontSize: '0.65rem' }}>Position</label>
                <select className="form-select" value={elem.position} style={{ padding: '4px 8px', fontSize: '0.75rem' }}
                  onChange={e => updateElement(elem.id, { position: e.target.value })}>
                  {positionOptions.map(po => (
                    <option key={po.value} value={po.value}>{po.label}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="form-row">
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ fontSize: '0.65rem' }}>X Offset ({project.unit})</label>
                <input type="number" className="form-input" value={elem.offsetX}
                  style={{ padding: '4px 8px', fontSize: '0.75rem' }}
                  onChange={e => updateElement(elem.id, { offsetX: parseFloat(e.target.value) || 0 })} />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ fontSize: '0.65rem' }}>Y Offset ({project.unit})</label>
                <input type="number" className="form-input" value={elem.offsetY}
                  style={{ padding: '4px 8px', fontSize: '0.75rem' }}
                  onChange={e => updateElement(elem.id, { offsetY: parseFloat(e.target.value) || 0 })} />
              </div>
            </div>
          </div>
        ))}
        <button className="btn btn-secondary btn-sm" style={{ width: '100%' }} onClick={addElement}>
          <Plus size={14} /> {lang === 'hi' || lang === 'both' ? 'तत्व जोड़ें' : 'Add Element'}
        </button>
      </Section>

      {/* ══════ SURROUNDINGS ══════ */}
      <Section title={lang === 'hi' || lang === 'both' ? 'आस-पास' : 'Surroundings'} icon={<Navigation size={14} />}>
        {(Object.keys(project.surroundings) as CardinalDirection[]).map(dir => (
          <div className="form-group" key={dir}>
            <label className="form-label">
              {dir.charAt(0).toUpperCase() + dir.slice(1)} 
              {lang === 'hi' || lang === 'both' ? ` (${dir === 'north' ? 'उत्तर' : dir === 'south' ? 'दक्षिण' : dir === 'east' ? 'पूर्व' : 'पश्चिम'})` : ''}
            </label>
            <input type="text" className="form-input" 
              value={project.surroundings[dir].label}
              placeholder="e.g., Open Road / Neighbor"
              onChange={e => updateSurrounding(dir, 'label', e.target.value)} />
            {(lang === 'hi' || lang === 'both') && (
              <input type="text" className="form-input" style={{ marginTop: 4 }}
                value={project.surroundings[dir].labelHi || ''}
                placeholder="हिंदी में..."
                onChange={e => updateSurrounding(dir, 'labelHi', e.target.value)} />
            )}
          </div>
        ))}
      </Section>

      {/* ══════ DISPLAY SETTINGS ══════ */}
      <Section title={lang === 'hi' || lang === 'both' ? 'दृश्य सेटिंग्स' : 'Display Settings'} icon={<Settings size={14} />}>
        {[
          { key: 'showDimensions', label: 'Dimensions', labelHi: 'माप' },
          { key: 'showCornerLabels', label: 'Corner Labels', labelHi: 'कोना लेबल' },
          { key: 'showDirectionLabels', label: 'Direction Labels', labelHi: 'दिशा लेबल' },
          { key: 'showArea', label: 'Area', labelHi: 'क्षेत्रफल' },
          { key: 'showSurroundings', label: 'Surroundings', labelHi: 'आस-पास' },
          { key: 'showInfoPanel', label: 'Info Panel', labelHi: 'जानकारी पैनल' },
          { key: 'showDisclaimer', label: 'Disclaimer', labelHi: 'अस्वीकरण' },
        ].map(({ key, label, labelHi }) => (
          <label key={key} className="checkbox-group" style={{ marginBottom: 6 }}>
            <input type="checkbox"
              checked={project.display[key as keyof typeof project.display] as boolean}
              onChange={e => onUpdate({
                display: { ...project.display, [key]: e.target.checked }
              })} />
            <span className="checkbox-label">
              {lang === 'hi' || lang === 'both' ? `${labelHi} (${label})` : label}
            </span>
          </label>
        ))}
        <div className="form-group" style={{ marginTop: 8 }}>
          <label className="form-label">Compass</label>
          <select className="form-select" value={project.display.showCompass}
            onChange={e => onUpdate({
              display: { ...project.display, showCompass: e.target.value as 'off' | 'compact' | 'detailed' }
            })}>
            <option value="detailed">Detailed</option>
            <option value="compact">Compact</option>
            <option value="off">Off</option>
          </select>
        </div>
      </Section>

      {/* ══════ ACTIONS ══════ */}
      <div style={{ padding: '16px 20px', borderTop: '1px solid var(--color-border)' }}>
        <div className="btn-group" style={{ marginBottom: 8 }}>
          <button className="btn btn-primary btn-sm" onClick={onExportPng}>
            <Download size={14} /> PNG
          </button>
          <button className="btn btn-primary btn-sm" onClick={onExportSvg}>
            <Download size={14} /> SVG
          </button>
          <button className="btn btn-primary btn-sm" onClick={onExportPdf}>
            <Download size={14} /> PDF
          </button>
        </div>
        <div className="btn-group">
          <button className="btn btn-secondary btn-sm" onClick={onSave}>
            <Download size={14} /> {lang === 'hi' || lang === 'both' ? 'सहेजें' : 'Save'}
          </button>
          <button className="btn btn-secondary btn-sm" onClick={onLoad}>
            <Upload size={14} /> {lang === 'hi' || lang === 'both' ? 'लोड करें' : 'Load'}
          </button>
        </div>
      </div>

      {/* Disclaimer */}
      <div className="disclaimer">
        {lang === 'hi' || lang === 'both'
          ? 'यह नक्शा उपयोगकर्ता द्वारा दिए गए मापों पर आधारित है और कानूनी रूप से प्रमाणित नहीं है।'
          : 'This map is based on user-provided dimensions and is not legally certified.'}
      </div>
    </div>
  );
};

export default Sidebar;
