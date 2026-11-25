// SPDX-License-Identifier: AGPL-3.0-only
/**
 * The two output columns of the tools file, checked row by row:
 *
 *   produces_artifact   blank (not known), `true` or `false`, nothing else
 *   artifact_type       one id of src/data/toolArtifactTypes.json; required when produces_artifact is
 *                       `true`; blank otherwise
 *
 * Returns the fields to put on the generated record. Throws on a bad row. Used by gen-tools.mjs.
 */
export function toolArtifactColumns(row, typeIds) {
  const flag = row.produces_artifact ?? ''
  const type = row.artifact_type ?? ''
  if (flag !== '' && flag !== 'true' && flag !== 'false') {
    throw new Error(`produces_artifact must be blank, true or false (got "${flag}")`)
  }
  if (type !== '' && !typeIds.includes(type)) {
    throw new Error(`artifact_type "${type}" is not one of ${typeIds.join(', ')}`)
  }
  if (flag === 'true' && type === '') {
    throw new Error('artifact_type is required when produces_artifact is true')
  }
  if (flag !== 'true' && type !== '') {
    throw new Error('artifact_type must be blank unless produces_artifact is true')
  }
  return {
    ...(flag === '' ? {} : { producesArtifact: flag === 'true' }),
    ...(type === '' ? {} : { artifactType: type }),
  }
}
