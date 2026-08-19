/** Animated gradient-mesh background — three blurred blobs drifting in CSS.
 * Cheap stand-in for a shader mesh gradient (BRIEF §5.1). */
export function GradientMesh() {
  return (
    <div
      className="pointer-events-none absolute inset-0 overflow-hidden"
      aria-hidden="true"
    >
      <div
        className="animate-float absolute -left-1/4 -top-1/4 h-[70vmax] w-[70vmax] rounded-full opacity-40 blur-[90px]"
        style={{ background: "var(--grad-cool)", animationDuration: "9s" }}
      />
      <div
        className="animate-float absolute -right-1/3 top-1/4 h-[60vmax] w-[60vmax] rounded-full opacity-30 blur-[90px]"
        style={{
          background: "var(--grad-hot)",
          animationDuration: "12s",
          animationDelay: "-3s",
        }}
      />
      <div
        className="animate-float absolute bottom-[-20%] left-1/4 h-[55vmax] w-[55vmax] rounded-full opacity-25 blur-[100px]"
        style={{
          background: "var(--grad-gold)",
          animationDuration: "14s",
          animationDelay: "-6s",
        }}
      />
    </div>
  );
}
