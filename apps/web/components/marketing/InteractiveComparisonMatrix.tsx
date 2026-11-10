export function InteractiveComparisonMatrix() {
  return (
    <div className="w-full max-w-5xl mx-auto space-y-8 text-left">
      <div className="text-center space-y-2 max-w-2xl mx-auto">
        <span className="text-[11px] font-mono font-semibold uppercase tracking-widest text-[var(--accent-default)]">
          Side-By-Side Comparison
        </span>
        <h2 className="text-2xl sm:text-4xl font-serif text-[var(--text-primary)]">
          Why Streamers Are Ditching Manual Scrubbing
        </h2>
        <p className="text-xs sm:text-sm text-[var(--text-muted)] leading-relaxed">
          See how ClipLane compares to editing by hand in Premiere or paying expensive AI subscriptions with forced watermarks.
        </p>
      </div>

      <div className="card-paper bg-[var(--bg-raised)] border border-[var(--line-paper)] rounded-[8px] overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-[var(--line-paper)] bg-[var(--bg-card)]">
                <th className="p-4 sm:p-5 font-mono uppercase text-[11px] text-[var(--text-muted)]">
                  Capability / Feature
                </th>
                <th className="p-4 sm:p-5 font-serif text-sm font-normal text-[var(--text-muted)]">
                  Manual Editing (Premiere / CapCut)
                </th>
                <th className="p-4 sm:p-5 font-serif text-sm font-normal text-[var(--text-muted)]">
                  Generic Online Clippers
                </th>
                <th className="p-4 sm:p-5 font-serif text-sm font-bold text-[var(--accent-default)] bg-blue-50/20">
                  ClipLane
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--line-paper)]">
              <tr>
                <td className="p-4 sm:p-5 font-medium text-[var(--text-primary)]">
                  Highlight Finding Time
                </td>
                <td className="p-4 sm:p-5 text-[var(--text-muted)]">
                  2 – 3 hours manual scrubbing
                </td>
                <td className="p-4 sm:p-5 text-[var(--text-muted)]">
                  10 – 20 mins slow queue
                </td>
                <td className="p-4 sm:p-5 font-semibold text-emerald-600 bg-blue-50/10">
                  ⚡ 30 – 60 seconds automated
                </td>
              </tr>

              <tr>
                <td className="p-4 sm:p-5 font-medium text-[var(--text-primary)]">
                  Free Tier Watermarks
                </td>
                <td className="p-4 sm:p-5 text-[var(--text-muted)]">
                  None (requires complex setup)
                </td>
                <td className="p-4 sm:p-5 text-red-600 font-medium">
                  ❌ Huge forced watermark logo
                </td>
                <td className="p-4 sm:p-5 font-semibold text-emerald-600 bg-blue-50/10">
                  ✓ 100% Watermark-Free Always
                </td>
              </tr>

              <tr>
                <td className="p-4 sm:p-5 font-medium text-[var(--text-primary)]">
                  Export Video Resolution
                </td>
                <td className="p-4 sm:p-5 text-[var(--text-muted)]">
                  Manual export settings
                </td>
                <td className="p-4 sm:p-5 text-amber-600">
                  Downscaled to 720p on free
                </td>
                <td className="p-4 sm:p-5 font-semibold text-emerald-600 bg-blue-50/10">
                  ✓ Full 1080x1920 HD (60fps)
                </td>
              </tr>

              <tr>
                <td className="p-4 sm:p-5 font-medium text-[var(--text-primary)]">
                  Aspect Ratio Framing
                </td>
                <td className="p-4 sm:p-5 text-[var(--text-muted)]">
                  Manual keyframing & blur effects
                </td>
                <td className="p-4 sm:p-5 text-[var(--text-muted)]">
                  Black bars or cropped heads
                </td>
                <td className="p-4 sm:p-5 font-semibold text-emerald-600 bg-blue-50/10">
                  ✓ Auto 9:16 Blurred Ambient Fill
                </td>
              </tr>

              <tr>
                <td className="p-4 sm:p-5 font-medium text-[var(--text-primary)]">
                  Pricing Model
                </td>
                <td className="p-4 sm:p-5 text-[var(--text-muted)]">
                  $24 – $50/mo Adobe subscription
                </td>
                <td className="p-4 sm:p-5 text-[var(--text-muted)]">
                  $29 – $49/mo recurring trap
                </td>
                <td className="p-4 sm:p-5 font-semibold text-emerald-600 bg-blue-50/10">
                  ✓ Free or $2.99 on demand
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
