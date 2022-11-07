/**
 * Action to be used with the CASL based permissions system
 */
export enum Action {
  /**
   * Manage a subject
   *
   * NOTE: "Manage" means "any action", equivalent with "*"
   */
  Manage = 'manage',

  /**
   * Create a subject
   */
  Create = 'create',

  /**
   * Read a subject
   */
  Read = 'read',

  /**
   * Update a subject
   */
  Update = 'update',

  /**
   * Delete a subject
   */
  Delete = 'delete',
}
