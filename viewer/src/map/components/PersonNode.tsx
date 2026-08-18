import { avatarFor, nodeStyle, personLabel, type NodeState } from '../display';
import type { PersonPlacement } from '../layout';
import type { VizTheme } from '../../theme/palette';

export interface PersonNodeProps {
  placement: PersonPlacement;
  theme: VizTheme;
  state: NodeState;
  nameMode: string;
  onSelect?: (personId: string) => void;
}

/** アイコンの中身。画像・イニシャル・人型のどれを描くかは display.ts が決める。 */
function AvatarContentShape({
  placement,
  nameMode,
  radius,
  color,
  fontSize,
  clipId,
}: {
  placement: PersonPlacement;
  nameMode: string;
  radius: number;
  color: string;
  fontSize: number;
  clipId: string;
}) {
  const content = avatarFor(placement.person, nameMode);

  if (content.kind === 'image') {
    return (
      <image
        href={content.src}
        x={-radius}
        y={-radius}
        width={radius * 2}
        height={radius * 2}
        clipPath={`url(#${clipId})`}
        preserveAspectRatio="xMidYMid slice"
      />
    );
  }

  if (content.kind === 'initial') {
    return (
      <text textAnchor="middle" dominantBaseline="central" fill={color} fontSize={fontSize} fontWeight={600}>
        {content.text}
      </text>
    );
  }

  /* 人型（頭と肩）。半径に対する比率で描くので、大きさが変わっても崩れない */
  const head = radius * 0.3;
  const shoulderWidth = radius * 0.62;
  const shoulderTop = radius * 0.12;
  return (
    <g clipPath={`url(#${clipId})`} fill={color}>
      <circle cy={-radius * 0.24} r={head} />
      <path
        d={`M ${-shoulderWidth} ${radius} v ${-radius * 0.34} a ${shoulderWidth} ${shoulderWidth * 0.9} 0 0 1 ${shoulderWidth * 2} 0 v ${radius * 0.34} Z`}
        transform={`translate(0 ${shoulderTop})`}
      />
    </g>
  );
}

/** 人物 1 人分のノード。1 人につき 1 つだけ描く。 */
export function PersonNode({ placement, theme, state, nameMode, onSelect }: PersonNodeProps) {
  const style = nodeStyle(theme, state);
  const label = personLabel(placement.person, nameMode);
  const attributes = placement.person.attributes;
  const clipId = `avatar-clip-${placement.person.id}`;

  return (
    <g
      transform={`translate(${placement.x} ${placement.y})`}
      onClick={onSelect ? () => onSelect(placement.person.id) : undefined}
      style={onSelect ? { cursor: 'pointer' } : undefined}
      role={onSelect ? 'button' : undefined}
      tabIndex={onSelect ? 0 : undefined}
      onKeyDown={
        onSelect
          ? (event) => {
              if (event.key === 'Enter' || event.key === ' ') onSelect(placement.person.id);
            }
          : undefined
      }
    >
      <title>{attributes.length > 0 ? `${label}（${attributes.join('・')}）` : label}</title>
      <defs>
        <clipPath id={clipId}>
          <circle r={style.radius} />
        </clipPath>
      </defs>
      <circle r={style.radius} fill={style.fill} stroke={style.ring} strokeWidth={style.ringWidth} />
      <AvatarContentShape
        placement={placement}
        nameMode={nameMode}
        radius={style.radius}
        color={style.glyphColor}
        fontSize={style.radius}
        clipId={clipId}
      />
      <circle
        r={style.radius}
        fill="none"
        stroke={style.ring}
        strokeWidth={style.ringWidth}
        pointerEvents="none"
      />
      <text
        y={style.labelOffsetY}
        textAnchor="middle"
        fill={style.labelColor}
        fontSize={style.labelFontSize}
        fontWeight={style.fontWeight}
      >
        {label}
      </text>
    </g>
  );
}
