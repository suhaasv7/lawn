-- Starting data: preset themes, site settings, and the current grid.
-- created_at is staggered so presets list in this order.

insert into public.themes
  (id, name, is_preset, bg, surface, raised, line, line_strong, fg, muted, faint, accent, glow_1, glow_2, created_at)
values
  ('midnight', 'Midnight', true, '#09090b', '#111114', '#19191d', 'rgb(255 255 255 / 0.08)', 'rgb(255 255 255 / 0.16)',
   '#fafafa', '#a1a1aa', '#6b6b74', '#8b5cf6', 'rgb(139 92 246 / 0.18)', 'rgb(59 130 246 / 0.12)', now() - interval '6 minutes'),
  ('carbon', 'Carbon', true, '#000000', '#0a0a0a', '#151515', 'rgb(255 255 255 / 0.09)', 'rgb(255 255 255 / 0.18)',
   '#ededed', '#a3a3a3', '#666666', '#ededed', 'rgb(255 255 255 / 0.06)', 'rgb(255 255 255 / 0.03)', now() - interval '5 minutes'),
  ('terminal', 'Terminal', true, '#040806', '#08110b', '#0d1a11', 'rgb(74 222 128 / 0.12)', 'rgb(74 222 128 / 0.26)',
   '#dcfce7', '#86b796', '#557a62', '#4ade80', 'rgb(74 222 128 / 0.14)', 'rgb(34 211 238 / 0.07)', now() - interval '4 minutes'),
  ('abyss', 'Abyss', true, '#050816', '#0a0f22', '#10172f', 'rgb(148 163 255 / 0.1)', 'rgb(148 163 255 / 0.22)',
   '#e6ebff', '#98a2c9', '#5f6996', '#22d3ee', 'rgb(34 211 238 / 0.14)', 'rgb(99 102 241 / 0.16)', now() - interval '3 minutes'),
  ('ember', 'Ember', true, '#0c0806', '#140e0a', '#1d140e', 'rgb(255 190 140 / 0.09)', 'rgb(255 190 140 / 0.2)',
   '#fbf1e9', '#bba595', '#7d6a5d', '#fb923c', 'rgb(251 146 60 / 0.16)', 'rgb(239 68 68 / 0.1)', now() - interval '2 minutes'),
  ('rose', 'Rosé', true, '#0d080c', '#160e14', '#20141d', 'rgb(255 170 220 / 0.09)', 'rgb(255 170 220 / 0.2)',
   '#fdf0f7', '#c3a5b6', '#86677a', '#f472b6', 'rgb(244 114 182 / 0.16)', 'rgb(167 139 250 / 0.12)', now() - interval '1 minute')
on conflict (id) do nothing;

insert into public.site_settings (id, theme_id, font, radius)
values (1, 'midnight', 'cascadia', 0)
on conflict (id) do nothing;

insert into public.tiles (id, kind, position, w, h, tone, props) values
  ('intro', 'intro', 0, 3, 2, 'accent', jsonb_build_object(
    'name', 'suhaas',
    'blurb', 'this is my lawn — a small patch of the internet where i keep things i make, links i like, and whatever else i feel like planting.')),
  ('fits', 'link', 1, 2, 2, 'rose', jsonb_build_object(
    'url', 'https://fits.sv7.space/', 'title', 'fits', 'note', 'wardrobe lookbook — log pieces, build outfits')),
  ('now', 'list', 2, 1, 1, 'amber', jsonb_build_object(
    'label', 'now', 'items', jsonb_build_array('building fits', 'making this site mine'))),
  ('clock', 'clock', 3, 1, 1, 'green', jsonb_build_object('label', 'local time', 'timeZone', 'Asia/Kolkata')),
  ('notes', 'note', 4, 3, 1, 'plain', jsonb_build_object(
    'label', 'notes', 'text', 'short thoughts, quotes and half-ideas will live here.')),
  ('github', 'link', 5, 1, 1, 'blue', jsonb_build_object(
    'url', 'https://github.com/suhaasv7', 'title', 'github', 'note', 'code & experiments')),
  ('colophon', 'note', 6, 2, 1, 'plain', jsonb_build_object(
    'label', 'colophon', 'text', 'built with next.js + supabase + swapy.'))
on conflict (id) do nothing;
