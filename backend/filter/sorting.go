package filter

import (
	"Finder-2/backend"
	"sort"
	"strings"
)

func SortByName(items []backend.FileItem, ascending bool) []backend.FileItem {
	sorted := make([]backend.FileItem, len(items))
	copy(sorted, items)

	sort.Slice(sorted, func(i, j int) bool {
		if ascending {
			return strings.ToLower(sorted[i].Name) < strings.ToLower(sorted[j].Name)
		}
		return strings.ToLower(sorted[i].Name) > strings.ToLower(sorted[j].Name)
	})

	return sorted
}

func SortByDate(items []backend.FileItem, ascending bool) []backend.FileItem {
	sorted := make([]backend.FileItem, len(items))
	copy(sorted, items)

	sort.Slice(sorted, func(i, j int) bool {
		if ascending {
			return sorted[i].ModifiedTime < sorted[j].ModifiedTime
		}
		return sorted[i].ModifiedTime > sorted[j].ModifiedTime
	})

	return sorted
}

func SortBySize(items []backend.FileItem, ascending bool) []backend.FileItem {
	sorted := make([]backend.FileItem, len(items))
	copy(sorted, items)

	sort.Slice(sorted, func(i, j int) bool {
		if ascending {
			return sorted[i].Size < sorted[j].Size
		}
		return sorted[i].Size > sorted[j].Size
	})

	return sorted
}
