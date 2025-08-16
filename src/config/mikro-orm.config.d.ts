import 'dotenv/config';
declare const _default: import('@mikro-orm/core').Options<
  import('@mikro-orm/mysql').MySqlDriver,
  import('@mikro-orm/mysql').EntityManager<
    import('@mikro-orm/mysql').MySqlDriver
  > &
    import('@mikro-orm/core').EntityManager<
      import('@mikro-orm/mysql').IDatabaseDriver<
        import('@mikro-orm/mysql').Connection
      >
    >
>;
export default _default;
//# sourceMappingURL=mikro-orm.config.d.ts.map
