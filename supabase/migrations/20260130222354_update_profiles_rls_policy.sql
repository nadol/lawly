-- migration: update_profiles_rls_policy
-- description: adds with check clause to profiles update policy for enhanced security
-- affected tables: profiles
-- affected policies: profiles_update_own
-- notes:
--   - the with check clause prevents users from changing their profile id during update
--   - this is an additional security layer on top of the using clause
--   - using clause: checks which rows can be updated (before update)
--   - with check clause: validates new values are allowed (after update)

-- =============================================================================
-- 1. drop existing policy
-- =============================================================================

-- drop the old policy that lacks the with check clause.
-- this is safe because we immediately recreate it with enhanced security.
drop policy if exists "profiles_update_own" on public.profiles;

-- =============================================================================
-- 2. create updated policy with with check
-- =============================================================================

-- authenticated users can update only their own profile.
-- used to set has_seen_welcome = true after dismissing the welcome screen.
--
-- using clause: ensures users can only update rows where id = auth.uid()
-- with check clause: ensures the id cannot be changed to another user's id
create policy "profiles_update_own"
  on public.profiles
  for update
  to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());
