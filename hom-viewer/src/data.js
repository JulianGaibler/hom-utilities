import yaml from 'yaml'

export async function getIndexData() {
  const response = await fetch('/compare_index.yaml')

  return yaml.parse(await response.text())
}

export async function getSiteData(id) {
  const response = await fetch(`/compare_results/${id}/result.yaml`)

  return yaml.parse(await response.text())
}
