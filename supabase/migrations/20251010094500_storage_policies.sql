-- Storage bucket note:
-- バケット作成はCLI/ダッシュボードで実施（SQLでは作られない）。
-- 作成後、storage.objects のRLSポリシーを設定する。

-- RLS（storage.objects は既定でRLS有効）
-- ルール: submissions バケットのみ、nameの先頭が auth.uid() と一致するオブジェクトを所有者とみなす

-- SELECT: 自分のプレフィックス配下のみ参照可 / admin は全参照可
create policy "storage_select_own_prefix" on storage.objects
for select
to authenticated
using (
  bucket_id = 'submissions'
  and split_part(name, '/', 1) = auth.uid()::text
);

create policy "storage_select_admin" on storage.objects
for select
to authenticated
using (
  (auth.jwt() ->> 'role') = 'admin'
  and bucket_id = 'submissions'
);

-- INSERT: 自分のプレフィックス配下にのみアップロード可
create policy "storage_insert_own_prefix" on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'submissions'
  and split_part(name, '/', 1) = auth.uid()::text
);

-- UPDATE/DELETE: 自分のプレフィックス配下のみ操作可 / admin は全操作可
create policy "storage_update_own_prefix" on storage.objects
for update
to authenticated
using (
  bucket_id = 'submissions'
  and split_part(name, '/', 1) = auth.uid()::text
)
with check (
  bucket_id = 'submissions'
  and split_part(name, '/', 1) = auth.uid()::text
);

create policy "storage_delete_own_prefix" on storage.objects
for delete
to authenticated
using (
  bucket_id = 'submissions'
  and split_part(name, '/', 1) = auth.uid()::text
);

create policy "storage_admin_all" on storage.objects
for all
to authenticated
using (
  (auth.jwt() ->> 'role') = 'admin'
  and bucket_id = 'submissions'
)
with check (
  (auth.jwt() ->> 'role') = 'admin'
  and bucket_id = 'submissions'
);
