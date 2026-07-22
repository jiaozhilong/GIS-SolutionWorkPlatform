const mapNodes = [
  { left: '13%', top: '22%', label: 'KB' },
  { left: '27%', top: '38%', label: 'AI' },
  { left: '46%', top: '28%', label: 'GIS' },
  { left: '62%', top: '48%', label: 'Flow' },
  { left: '78%', top: '32%', label: 'PPT' },
  { left: '84%', top: '66%', label: 'Log' }
];

export default function GisBackground() {
  return (
    <div className="gis-background" aria-hidden="true">
      <div className="gis-background__basemap" />
      <div className="gis-background__roads" />
      <div className="gis-background__grid" />
      <div className="gis-background__routes">
        <span className="route route-a" />
        <span className="route route-b" />
        <span className="route route-c" />
      </div>
      {mapNodes.map((node) => (
        <span key={node.label} className="gis-background__node" style={{ left: node.left, top: node.top }}>
          {node.label}
        </span>
      ))}
      <div className="gis-background__scanline" />
      <div className="gis-background__contours" />
      <div className="gis-background__vignette" />
    </div>
  );
}
