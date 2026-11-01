<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

# Project rules

- All UI copy is in Indonesian (application name: "Sistem Rekap Mengajar Dosen Fakultas Vokasi Institut Az Zuhra").
- App data lives in Lovable Cloud (tables `dosen`, `mata_kuliah`, `kelas`, `pertemuan`) accessed through the React context in `src/lib/store.tsx`; keep the `useAppData` API stable when touching that file. Tables are shared and anon-accessible by user request (no login yet); adding login later means revisiting the RLS policies.
- Phase 1 scope only: no honor/payroll system, no Excel import, no audit log, no approval workflow, no charts, and no permanent dummy/seed data unless the user asks.
- Rekap print output must keep the black table borders and dark-purple header via tokens (`border-foreground`, `bg-primary`) and the print CSS in `src/styles.css`; the document title is "Rekap Absensi Dosen".
- Do not add new libraries; the existing shadcn/ui components cover the UI needs.
