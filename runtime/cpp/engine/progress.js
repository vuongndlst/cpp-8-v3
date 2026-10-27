/* Academic eligibility is shared by Boss HP, completion and both certificate buttons. */
(function (root) {
  "use strict";
  const required = step => (step?.challenges || []).filter(c => !c.advanced && !c.bonus);
  function assess(steps, passed = {}) {
    const stages = steps.filter(s => s.kind !== "gate");
    const missing = stages.flatMap(s => required(s).filter(c => !passed[c.id]).map(c => ({
      id: c.id, title: c.title || c.id, stage: s.id, stageTitle: s.nav || s.title || s.id
    })));
    const boss = stages.find(s => s.kind === "boss"), tasks = required(boss);
    const done = tasks.filter(c => passed[c.id]).length;
    const completed = stages.length > 0 && missing.length === 0;
    const advanced = (boss?.challenges || []).filter(c => c.advanced && !c.bonus);
    return {
      completed,
      gold: completed && advanced.length > 0 && advanced.every(c => passed[c.id]),
      missing,
      boss: {
        total: tasks.length, done,
        hp: tasks.length ? Math.round(100 * (tasks.length - done) / tasks.length) : 0,
        completed: tasks.length > 0 && done === tasks.length,
        missing: missing.filter(c => c.stage === boss?.id)
      }
    };
  }
  root.CppProgress = { required, assess };
})(window);
