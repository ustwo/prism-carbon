/*******************************************************************************
 *                                  STATE.TS                                   *
 *             HOLDS THE STATE OF THE PROXY SERVER FOR TESTING AND             *
 * TO PREVENT MULTIPLE INSTANCES OF THE PROXY SERVER RUNNING AT THE SAME TIME. *
 *******************************************************************************/

export let state = {
    runningInterceptor: false
};