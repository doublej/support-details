<script lang="ts">
import '@fontsource-variable/bricolage-grotesque'
import '@fontsource/ibm-plex-mono/400.css'
import '@fontsource/ibm-plex-mono/500.css'
import '../app.css'
import type { Snippet } from 'svelte'

let { children }: { children: Snippet } = $props()
</script>

{@render children()}
