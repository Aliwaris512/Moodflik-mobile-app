/** Token held in memory only while the user decides to reactivate a deactivated account. */
let pending: { token: string; uuid: string } | null = null;

export const pendingLogin = {
  set: (value: { token: string; uuid: string } | null) => {
    pending = value;
  },
  get: () => pending,
};
