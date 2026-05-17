# Projects

This is the main user-facing output area.

If a user wants to find the result of a request, start here first.

Agent Computer should save durable work here:

```text
projects/<project-slug>/
  source/
  converted/
  research/
  reports/
  presentations/
  qa/
  assets/
  tasks/
  archive/
```

Most users should be able to find their results by opening `projects/` and choosing the relevant project.

Operating files such as agent definitions, tools, policies, templates, and registries live outside this folder. They run the workspace, but final user-facing work should not be buried there.

Do not commit real user projects, private reports, converted private documents, or generated work artifacts.
