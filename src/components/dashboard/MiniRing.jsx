import { ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { PALETTE, FONT_BODY, FONT_MONO } from "../../theme/palette";

export default function MiniRing({ percent, color, label }) {
  const clamped = Math.min(Math.max(percent, 0), 1);
  const data = [{ value: clamped }, { value: 1 - clamped }];
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: 70 }}>
      <div style={{ width: 60, height: 60, position: "relative" }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              startAngle={90}
              endAngle={-270}
              innerRadius={20}
              outerRadius={28}
              stroke="none"
              isAnimationActive={false}
            >
              <Cell fill={color} />
              <Cell fill={PALETTE.hairline} />
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: FONT_MONO,
            fontSize: 11,
            fontWeight: 700,
            color: PALETTE.text,
          }}
        >
          {Math.round(clamped * 100)}%
        </div>
      </div>
      <div style={{ fontFamily: FONT_BODY, fontSize: 10, color: PALETTE.textMuted, textAlign: "center", marginTop: 4, lineHeight: 1.2 }}>
        {label}
      </div>
    </div>
  );
}
