/// <reference types="vite/client" />

declare module 'lucide-react';

declare module '@hugeicons/core-free-icons';

declare module '@hugeicons/react' {
  import React from 'react';
  export interface HugeiconsIconProps extends React.SVGProps<SVGSVGElement> {
    icon: any;
    size?: number | string;
    color?: string;
    strokeWidth?: number;
    className?: string;
  }
  export const HugeiconsIcon: React.FC<HugeiconsIconProps>;
}

declare module '@thesvg/react' {
  import React from 'react';
  const Component: React.FC<React.SVGProps<SVGSVGElement> & { variant?: string }>;
  export default Component;
}

declare module '@thesvg/react/*' {
  import React from 'react';
  const Component: React.FC<React.SVGProps<SVGSVGElement> & { variant?: string }>;
  export default Component;
}

declare module 'thesvg/*' {
  const content: any;
  export default content;
}
