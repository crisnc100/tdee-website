import { pct, points } from '@/lib/lab/format';
import type { SweepGrid } from '@/lib/lab/report';
import { HEAT_LEGEND, heatBackground } from './heat';

/**
 * Coverage of each band by mean logging bias (rows) and checkpoint day
 * (columns), shaded by how far it sits from nominal. A real table rather than
 * a picture: every number is in the markup, under its row and column headers.
 * Each bias level is its own row group; the bar down the left marks the range
 * whose early bands the CI gate asserts.
 */
export default function SweepTable({ grid }: { grid: SweepGrid }) {
  return (
    <div className="space-y-3">
      <table className="w-full readout text-xs text-foreground border-collapse">
        <caption className="sr-only">
          Coverage of the 50, 80 and 95% bands by mean logging bias and day, percent. Bias levels from 0 to{' '}
          {pct(Math.max(...grid.rows.filter((r) => r.gatedEarly).map((r) => r.bias)))}% are in the gated range.
        </caption>
        <thead>
          <tr className="border-b border-border-strong">
            <th scope="col" className="py-1.5 pl-2.5 pr-1 text-left font-normal text-muted-foreground">
              Bias
            </th>
            <th scope="col" className="py-1.5 px-1 text-left font-normal text-muted-foreground">
              Band
            </th>
            {grid.days.map((day) => (
              <th key={day} scope="col" className="py-1.5 px-1 text-center font-normal text-muted-foreground">
                <span aria-hidden="true" className="sm:hidden">
                  d{day}
                </span>
                <span aria-hidden="true" className="hidden sm:inline">
                  Day {day}
                </span>
                <span className="sr-only">Day {day}</span>
              </th>
            ))}
          </tr>
        </thead>
        {grid.rows.map((row) => (
          <tbody key={row.bias} className="border-b border-border">
            {row.levels.map((lv, i) => (
              <tr key={lv.level}>
                {i === 0 && (
                  <th
                    scope="rowgroup"
                    rowSpan={row.levels.length}
                    className={`py-1 pl-2 pr-1 text-left align-top font-normal border-l-[3px] ${
                      row.gatedEarly ? 'border-accent-ink' : 'border-warning'
                    }`}
                  >
                    <span className="block text-sm text-foreground">{pct(row.bias)}%</span>
                    <span className={`block label-caps text-[0.625rem] ${row.gatedEarly ? 'text-accent-ink' : 'text-warning'}`}>
                      {row.gatedEarly ? 'gated' : 'not gated'}
                    </span>
                    <span className="block text-[0.6875rem] text-muted-foreground">
                      <span className="sr-only">measured </span>gap {points(row.measuredGap, 1)}%
                    </span>
                  </th>
                )}
                <th scope="row" className="py-1 px-1 text-left font-normal text-muted-foreground">
                  {pct(lv.nominal)}%
                </th>
                {lv.cells.map((cell) => (
                  <td key={cell.day} className="py-1 px-1 text-center" style={heatBackground(cell.bin)}>
                    {pct(cell.observed)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        ))}
      </table>

      <ul className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-muted-foreground" aria-label="Shading">
        {HEAT_LEGEND.map((entry) => (
          <li key={entry.bin} className="inline-flex items-center gap-2">
            <span
              aria-hidden="true"
              className="inline-block w-4 h-3 border border-border-strong"
              style={heatBackground(entry.bin)}
            />
            {entry.label}
          </li>
        ))}
      </ul>
    </div>
  );
}
