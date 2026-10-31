/** Content-area skeleton shown while browser data loads. */
export default function PageSkeleton() {
  return (
    <div aria-busy>
      <div className="sk sk-title" />
      <div className="stats">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="sk sk-stat" />
        ))}
      </div>
      <div className="sk sk-card" />
    </div>
  );
}
