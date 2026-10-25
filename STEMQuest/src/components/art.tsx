export function WorldArt({
  kind = "planet",
  className = "",
}: {
  kind?: string;
  className?: string;
}) {
  return (
    <svg
      className={className}
      viewBox="0 0 360 200"
      fill="none"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={"sky-" + kind} x2="1" y2="1">
          <stop
            stopColor={
              kind === "flask"
                ? "#c9eee2"
                : kind === "robot"
                  ? "#ffedcd"
                  : kind === "city"
                    ? "#ffd9e3"
                    : kind === "brain"
                      ? "#d4e9ff"
                      : kind === "chart"
                        ? "#eedcf8"
                        : "#ded9ff"
            }
          />
          <stop
            offset="1"
            stopColor={
              kind === "flask"
                ? "#e6f8f0"
                : kind === "robot"
                  ? "#fff5e3"
                  : "#f5f0ff"
            }
          />
        </linearGradient>
        <linearGradient id={"orb-" + kind} x2="1" y2="1">
          <stop stopColor="#a89afe" />
          <stop offset="1" stopColor="#6553cf" />
        </linearGradient>
      </defs>
      <rect width="360" height="200" fill={"url(#sky-" + kind + ")"} />
      <circle cx="300" cy="35" r="56" fill="white" opacity=".28" />
      <circle cx="40" cy="180" r="68" fill="white" opacity=".3" />
      <g stroke="white" strokeWidth="2" opacity=".8">
        <path d="M54 39v10m-5-5h10M288 145v12m-6-6h12M315 80v8m-4-4h8M92 137v8m-4-4h8" />
      </g>
      {kind === "planet" ? (
        <>
          <circle cx="182" cy="98" r="53" fill="url(#orb-planet)" />
          <path
            d="M140 67c24 17 51 21 86 16M132 99c29 17 59 23 97 16"
            stroke="#c4b7ff"
            strokeWidth="8"
            opacity=".5"
          />
          <ellipse
            cx="183"
            cy="103"
            rx="99"
            ry="21"
            transform="rotate(-25 183 103)"
            stroke="#b9aaf2"
            strokeWidth="13"
          />
          <path
            d="M97 144c20 15 69 5 118-18"
            stroke="#e6dcff"
            strokeWidth="9"
            strokeLinecap="round"
          />
          <circle cx="275" cy="44" r="14" fill="#f3be75" />
          <circle cx="78" cy="63" r="6" fill="#9c91d6" />
        </>
      ) : kind === "flask" ? (
        <>
          <path
            d="M154 35h51m-40 0v52l-41 66q-9 17 11 17h89q20 0 10-17l-40-66V35"
            stroke="#4c8680"
            strokeWidth="8"
            strokeLinecap="round"
            fill="#f2fffa"
          />
          <path d="M149 122h60l23 35q5 9-9 9h-87q-12 0-7-9z" fill="#49c5a2" />
          <circle cx="168" cy="141" r="7" fill="#b5f3ca" />
          <circle cx="198" cy="154" r="4" fill="#b5f3ca" />
          <circle cx="185" cy="103" r="5" fill="#5bcfa6" />
          <circle cx="235" cy="56" r="11" fill="#a3ddbb" />
          <path d="M92 87l10 21 24-5-13-20z" fill="#c4a8ed" />
          <path d="M100 73l10 10" stroke="#8566ae" strokeWidth="5" />
        </>
      ) : kind === "robot" ? (
        <>
          <ellipse
            cx="183"
            cy="174"
            rx="65"
            ry="10"
            fill="#dec8a1"
            opacity=".4"
          />
          <path
            d="M166 136v26m35-26v26"
            stroke="#b78753"
            strokeWidth="12"
            strokeLinecap="round"
          />
          <rect x="145" y="105" width="75" height="44" rx="13" fill="#e7b567" />
          <path
            d="M144 114l-22 15m100-15 19-23"
            stroke="#d19f53"
            strokeWidth="12"
            strokeLinecap="round"
          />
          <path d="M180 50V34" stroke="#c4944d" strokeWidth="5" />
          <circle cx="180" cy="32" r="7" fill="#f17e73" />
          <rect
            x="129"
            y="51"
            width="109"
            height="66"
            rx="23"
            fill="#fffdf4"
            stroke="#e2bd80"
            strokeWidth="4"
          />
          <rect x="141" y="64" width="85" height="39" rx="14" fill="#334452" />
          <circle cx="164" cy="83" r="6" fill="#90e6d2" />
          <circle cx="205" cy="83" r="6" fill="#90e6d2" />
          <path
            d="M177 91q7 6 14 0"
            stroke="#90e6d2"
            strokeWidth="3"
            strokeLinecap="round"
          />
          <rect x="173" y="122" width="22" height="12" rx="4" fill="#fff4c9" />
        </>
      ) : kind === "city" ? (
        <>
          <path
            d="M79 164h212"
            stroke="#bb6688"
            strokeWidth="7"
            strokeLinecap="round"
          />
          <rect x="102" y="80" width="49" height="81" rx="6" fill="#d89ac3" />
          <rect x="161" y="47" width="60" height="114" rx="7" fill="#a18bce" />
          <rect x="231" y="105" width="41" height="56" rx="6" fill="#edb28f" />
          {[0, 1, 2].map((i) => (
            <g key={i} fill="#f7e8f5">
              <rect x="115" y={95 + i * 21} width="9" height="9" rx="2" />
              <rect x="131" y={95 + i * 21} width="9" height="9" rx="2" />
              <rect x="175" y={67 + i * 27} width="10" height="13" rx="2" />
              <rect x="197" y={67 + i * 27} width="10" height="13" rx="2" />
            </g>
          ))}
          <path d="M192 47V28" stroke="#9075be" strokeWidth="5" />
        </>
      ) : kind === "brain" ? (
        <>
          <rect
            x="126"
            y="55"
            width="112"
            height="101"
            rx="25"
            fill="#729ad2"
          />
          <rect x="140" y="68" width="84" height="72" rx="17" fill="#edf7ff" />
          <path
            d="M158 104l16-17 20 26 15-19"
            stroke="#9482d0"
            strokeWidth="7"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {[0, 1, 2].map((i) => (
            <g key={i} stroke="#729ad2" strokeWidth="7" strokeLinecap="round">
              <path
                d={`M${150 + i * 32} 43V31M${150 + i * 32} 167v12M115 ${79 + i * 28}H99M249 ${79 + i * 28}h16`}
              />
            </g>
          ))}
        </>
      ) : (
        <>
          <rect x="94" y="52" width="178" height="107" rx="12" fill="#8e72b0" />
          <rect x="104" y="62" width="158" height="85" rx="6" fill="#faf5ff" />
          <path
            d="M154 178h60m-30-19v19"
            stroke="#997bb5"
            strokeWidth="9"
            strokeLinecap="round"
          />
          <path
            d="M122 127l28-23 26 10 27-31 37-8"
            stroke="#a48bd0"
            strokeWidth="6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle cx="203" cy="83" r="7" fill="#edb770" />
        </>
      )}
    </svg>
  );
}
export function HeroArt() {
  return (
    <svg
      viewBox="0 0 480 300"
      className="hero-art"
      fill="none"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="heroPlanet" x2="1" y2="1">
          <stop stopColor="#a9a0f6" />
          <stop offset="1" stopColor="#5b49aa" />
        </linearGradient>
      </defs>
      <g fill="#b5aceb">
        <circle cx="100" cy="45" r="2" />
        <circle cx="385" cy="45" r="3" />
        <circle cx="415" cy="152" r="2" />
        <circle cx="75" cy="180" r="3" />
        <circle cx="210" cy="31" r="2" />
        <circle cx="345" cy="235" r="2" />
      </g>
      <path
        d="M60 95v12m-6-6h12M352 72v12m-6-6h12M438 204v12m-6-6h12"
        stroke="#b4a7e3"
        strokeWidth="2"
      />
      <circle cx="302" cy="150" r="93" fill="url(#heroPlanet)" />
      <path
        d="M227 100c54 38 104 40 158 27M212 155c49 32 113 43 177 28"
        stroke="#b2a2f2"
        strokeWidth="15"
        opacity=".25"
      />
      <ellipse
        cx="300"
        cy="166"
        rx="142"
        ry="31"
        transform="rotate(-24 300 166)"
        stroke="#ad93d5"
        strokeWidth="15"
      />
      <path
        d="M175 225c34 17 102-1 162-25"
        stroke="#dfc7ee"
        strokeWidth="10"
        strokeLinecap="round"
      />
      <circle cx="118" cy="63" r="23" fill="#f4bd76" />
      <path d="M98 63q20 10 40 1" stroke="#fcd799" strokeWidth="6" />
      <g transform="translate(70 145) rotate(-14)">
        <path
          d="M44 61v28m34-28v28"
          stroke="#dad9f6"
          strokeWidth="13"
          strokeLinecap="round"
        />
        <rect x="27" y="30" width="65" height="48" rx="18" fill="#ebecff" />
        <path
          d="M25 43L8 56m86-13 16-21"
          stroke="#ebecff"
          strokeWidth="13"
          strokeLinecap="round"
        />
        <rect x="18" y="-15" width="84" height="64" rx="27" fill="#f7f6ff" />
        <rect x="29" y="-2" width="62" height="35" rx="15" fill="#322d65" />
        <circle cx="46" cy="13" r="5" fill="#8fe8d4" />
        <circle cx="75" cy="13" r="5" fill="#8fe8d4" />
        <path d="M56 23q5 4 10 0" stroke="#8fe8d4" strokeWidth="2.5" />
        <rect x="47" y="48" width="25" height="16" rx="5" fill="#a195e5" />
        <circle cx="60" cy="55" r="4" fill="#f6c67e" />
      </g>
      <path
        d="m395 94 6 10 12 2-9 8 2 12-11-6-11 6 2-12-9-8 12-2z"
        fill="#f7ce80"
      />
    </svg>
  );
}
