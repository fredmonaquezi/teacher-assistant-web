import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";
import RubricsPage from "./RubricsPage";

afterEach(() => {
  vi.restoreAllMocks();
});

test("keeps add-category modal open when category mutation fails", async () => {
  vi.spyOn(window, "confirm").mockReturnValue(true);

  const handleCreateRubricCategory = vi.fn().mockResolvedValue(false);

  render(
    <RubricsPage
      formError=""
      rubrics={[
        {
          id: "rubric-1",
          title: "Writing Rubric",
          grade_band: "Years 4-6",
          subject: "English",
        },
      ]}
      rubricCategories={[]}
      rubricCriteria={[]}
      loading={false}
      seedingRubrics={false}
      handleSeedDefaultRubrics={vi.fn()}
      handleCreateRubricTemplate={vi.fn()}
      handleUpdateRubricTemplate={vi.fn()}
      handleDeleteRubricTemplate={vi.fn()}
      handleDeleteAllRubrics={vi.fn()}
      handleCreateRubricCategory={handleCreateRubricCategory}
      handleDeleteRubricCategory={vi.fn()}
      handleCreateRubricCriterion={vi.fn()}
      handleDeleteRubricCriterion={vi.fn()}
      handleUpdateRubricCriterion={vi.fn()}
    />
  );

  fireEvent.click(screen.getByText("Writing Rubric"));
  fireEvent.click(screen.getByRole("button", { name: "rubrics.addCategory" }));
  fireEvent.change(screen.getByPlaceholderText("rubrics.modal.categoryNamePlaceholder"), {
    target: { value: "Analysis" },
  });
  fireEvent.click(screen.getByRole("button", { name: "common.actions.add" }));

  await waitFor(() =>
    expect(handleCreateRubricCategory).toHaveBeenCalledWith({
      rubricId: "rubric-1",
      name: "Analysis",
      sortOrder: 0,
    })
  );
  expect(screen.getByRole("heading", { name: "rubrics.modal.newCategoryTitle" })).toBeTruthy();
});
