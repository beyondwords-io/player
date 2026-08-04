<script>
  export let size = 24;
  export let color = "currentColor";
</script>

<!-- The only mic glyph in the flows: the mic is off while typing mid-call. -->
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width={size} height={size} fill="none" aria-hidden="true">
  <path d="M12 4a2.5 2.5 0 0 1 2.5 2.5V11a2.5 2.5 0 0 1-5 0V6.5A2.5 2.5 0 0 1 12 4Z" stroke={color} stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
  <path d="M6.5 11a5.5 5.5 0 0 0 11 0M12 16.5V20" stroke={color} stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
  <path d="M4.5 4.5l15 15" stroke={color} stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
</svg>
